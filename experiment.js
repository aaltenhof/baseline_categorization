// Declare participant_id at the top
let participant_id;
let prolific_id;

// Initialize jsPsych
const jsPsych = initJsPsych();

// Generate participant ID
async function generateParticipantId() {
    const baseId = Math.floor(Math.random() * 999) + 1;
    return `participant${baseId}`;
}

// Initialize and run the experiment
async function initializeAndRun() {
    // Set participant_id first before creating any trials
    participant_id = await generateParticipantId();
}

const filename = `${participant_id}.csv`;

// Function to load trials based on condition
async function loadTrials() {
    try {
        // Get condition from DataPipe
        const condition = await jsPsychPipe.getCondition("cSLwXHzhSpL2");
        console.log('Assigned condition:', condition);
        
        // Determine which file to load
        let filename = 'trials/test_quad.csv'; // default file
        if (condition === 0) filename = 'trials/quad1.csv';
        if (condition === 1) filename = 'trials/quad2.csv';
        if (condition === 2) filename = 'trials/quad3.csv';
        if (condition === 3) filename = 'trials/quad4.csv';
        
        const response = await fetch(filename);
        const csvText = await response.text();
        
        const results = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true
        });
        
        console.log('Loaded trials from:', filename);
        return results.data;
    } catch (error) {
        console.error('Error loading trials:', error);
        return [];
    }
}

// Function to create image path
function getImagePath(stimName) {
    return `stimuli/visual/${stimName}.png`;
}

// Function to create trials
function createTrials(trialsData) {
    let allTrials = [];
    
    trialsData.forEach(trial => {
        // Create arrays of stimuli and their categories
        let choiceStims = [
            { stim: trial.left_stim, cat: trial.left_cat },
            { stim: trial.middle_stim, cat: trial.middle_cat },
            { stim: trial.right_stim, cat: trial.right_cat }
        ];
        
        // Shuffle the choice stimuli
        for (let i = choiceStims.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [choiceStims[i], choiceStims[j]] = [choiceStims[j], choiceStims[i]];
        }

        // First part: Show only the top stimulus with placeholder space for buttons
        const topStimTrial = {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
                    <img src="${getImagePath(trial.top_stim)}" 
                         style="max-width:200px; max-height:200px;" 
                         id="stimulus-image">
                    <div style="height: 200px;"></div>  <!-- Placeholder for buttons -->
                </div>
            `,
            choices: "NO_KEYS",
            trial_duration: 500,
            data: {
                trial_part: 'top_stimulus',
                trial_num: trial.trial_num
            }
        };

        // Second part: Show both top stimulus and shuffled choice buttons
        const choiceTrial = {
            type: jsPsychImageButtonResponse,
            stimulus: getImagePath(trial.top_stim),
            stimulus_height: 200,
            maintain_aspect_ratio: true,
            choices: choiceStims.map(stim => 
                '<img src="' + getImagePath(stim.stim) + '" style="max-width:200px; max-height:200px;">'
            ),
            response_ends_trial: true,
            post_trial_gap: 500,
            data: {
                subCode: participant_id,
                trial_num: trial.trial_num,
                condition: trial.condition,
                top_stim: trial.top_stim,
                top_cat: trial.top_cat,
                // Store shuffled positions
                left_stim: choiceStims[0].stim,
                left_cat: choiceStims[0].cat,
                middle_stim: choiceStims[1].stim,
                middle_cat: choiceStims[1].cat,
                right_stim: choiceStims[2].stim,
                right_cat: choiceStims[2].cat,
                // Store original positions for reference
                orig_left_stim: trial.left_stim,
                orig_left_cat: trial.left_cat,
                orig_middle_stim: trial.middle_stim,
                orig_middle_cat: trial.middle_cat,
                orig_right_stim: trial.right_stim,
                orig_right_cat: trial.right_cat
            },
            on_load: function() {
                let observer = new MutationObserver((mutations, obs) => {
                    let stimulusElement = document.querySelector('.jspsych-image-button-response-stimulus');
                    if (stimulusElement) {
                        stimulusElement.setAttribute('id', 'stimulus-image');
                        obs.disconnect();
                    }
                });
            
                observer.observe(document.body, { childList: true, subtree: true });
            },
            on_finish: function(data) {
                // Use the shuffled positions for response recording
                const response_stim = choiceStims[data.response].stim;
                const response_cat = choiceStims[data.response].cat;
                
                // Add these properties to the data object
                data.response_stim = response_stim;
                data.response_cat = response_cat;
                data.rt = Math.round(data.rt);
                data.trial_part = 'choice'; // Add this to make filtering easier
            }
        };

        allTrials.push(topStimTrial, choiceTrial);
    });
    
    return allTrials;
}

// Create instructions
const instructions = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <h3>Thank you for participating in this experiment!</h3>
        <p>In this task, you will be shown four shapes. One on the top, and three on the bottom.
        <p>Use the mouse to select whether the left, right or middle shape is most similar to the top shape as quickly as you can.</p>
        <p>At the end, there will be a survey, after which you will receive your Prolific completion code.</p>
        <p>The study will take about TIME minutes.</p>
        <p>Press any key when you are ready to continue.</p>
    `
};

// Create consent trial
const consent = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="width: 800px;">
            <h3>Consent to Participate in Research</h3>
            <p>Consent will go here</p>
            <p>Please click "I Agree" if you wish to participate.</p>
        </div>
    `,
    choices: ['I Agree', 'I Do Not Agree'],
    data: {
        trial_type: 'consent'
    },
    on_finish: function(data) {
        if(data.response == 1) {
            jsPsych.endExperiment('Thank you for your time. The experiment has been ended.');
        }
    }
};

// Create Prolific ID trial
const pid = {
    type: jsPsychSurveyText,
    questions: [
        {prompt: `<p>Please enter your Prolific ID</p>`}
    ],
    data: {
        trial_type: 'pid'
    },
    on_finish: function(data) {
        // Store Prolific ID from the response - survey-text stores it in response object
        prolific_id = data.response.Q0.trim(); // trim to remove any whitespace
        console.log('Captured Prolific ID:', prolific_id);
        
        // Store it in jsPsych's data
        jsPsych.data.addProperties({
            prolific_id: prolific_id
        });
    }
};

// Automatic fullscreen trial
const fullscreen_trial = {
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    delay_after: 0,
    button_label: null,
    message: null
};

// End fullscreen before survey redirect
const end_fullscreen = {
    type: jsPsychFullscreen,
    fullscreen_mode: false,
    button_label: null,
    message: null
};

// Survey redirect trial
const survey_redirect = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <p>You have completed the experiment!</p>
        <p>You will now be redirected to a brief survey, after which you will receive your Prolific completion code</p>
        <p>Press any key to continue.</p>
    `,
    on_finish: function() {
        window.location = "https://uwmadison.co1.qualtrics.com/jfe/form/SV_a9GuS8KJgA1mJTg";
    }
};

// Function to filter and format data for saving
function getFilteredData() {
    // Get all data
    const allData = jsPsych.data.get().values();
    
    // Filter choice trials
    const choiceTrials = allData.filter(trial => 
        trial.trial_type === 'image-button-response' && 
        trial.top_stim !== undefined
    );
    
    console.log('Number of choice trials found:', choiceTrials.length);
    
    // Map to final format
    const formattedData = choiceTrials.map(trial => ({
        subCode: participant_id,
        condition: trial.condition || '',
        trial_num: trial.trial_num,
        top_stim: trial.top_stim,
        top_cat: trial.top_cat,
        left_stim: trial.left_stim,
        left_cat: trial.left_cat,
        middle_stim: trial.middle_stim,
        middle_cat: trial.middle_cat,
        right_stim: trial.right_stim,
        right_cat: trial.right_cat,
        rt: trial.rt,
        time_elapsed: trial.time_elapsed,
        prolific_id: prolific_id,
        response_stim: trial.response_stim,
        response_cat: trial.response_cat,
        orig_left_stim: trial.orig_left_stim,
        orig_left_cat: trial.orig_left_cat,
        orig_middle_stim: trial.orig_middle_stim,
        orig_middle_cat: trial.orig_middle_cat,
        orig_right_stim: trial.orig_right_stim,
        orig_right_cat: trial.orig_right_cat
    }));

    console.log('Formatted data length:', formattedData.length);
    return JSON.stringify(formattedData);
}

// Configure data saving
const save_data = {
    type: jsPsychPipe,
    action: "save",
    experiment_id: "cSLwXHzhSpL2",
    filename: filename,
    data_string: getFilteredData,
    success_callback: function() {
        console.log('Data saved successfully to DataPipe');
        const data = JSON.parse(getFilteredData());
        console.log('Number of trials saved:', data.length);
    },
    error_callback: function(error) {
        console.error('Error saving to DataPipe:', error);
    }
};

// Main experiment function
async function runExperiment() {
    try {
        // Load trials from CSV
        const trialsData = await loadTrials();
        console.log('Loaded trials:', trialsData.length);
        
        if (trialsData.length === 0) {
            console.error('No trials loaded!');
            return;
        }

        // Create timeline
        const timeline = [
            consent,
            fullscreen_trial,
            pid,
            instructions,
            ...createTrials(trialsData),
            save_data,
            end_fullscreen,
            survey_redirect
        ];

        console.log('Timeline created with', timeline.length, 'items');

        // Run the experiment
        await jsPsych.run(timeline);
    } catch (error) {
        console.error('Error running experiment:', error);
    }
}

// Start the experiment when the page loads
runExperiment();

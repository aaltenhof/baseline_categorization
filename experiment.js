// Declare participant_id at the top
let participant_id;
let prolific_id;

// Initialize jsPsych
const jsPsych = initJsPsych({
    on_finish: function() {
        jsPsych.data.displayData();
    }
});

// Generate participant ID
async function generateParticipantId() {
    const baseId = Math.floor(Math.random() * 999) + 1;
    return `participant${baseId}`;
}

// Initialize and run the experiment
async function initializeAndRun() {
    // Set participant_id first before creating any trials
    participant_id = await generateParticipantId();
    
    // Then create and run timeline
    const timeline = await createTimeline();
    await jsPsych.run(timeline);
}

const filename = `${participant_id}.csv`;

// Function to load and parse CSV
//UPDATE TO dynamically generate trials file
//create pid - if it is even ab, odd ad, else or rotates through a file that tells it when to generate??
async function loadTrials() {
    try {
        const response = await fetch('trials/test_quad.csv');
        const csvText = await response.text();
        
        const results = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true
        });
        
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
                
                data.response_stim = response_stim;
                data.response_cat = response_cat;
                data.rt = Math.round(data.rt);
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

//Re-route to demographics

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

cSLwXHzhSpL2

const save_data = {
    type: jsPsychPipe,
    action: "save",
    experiment_id: "cSLwXHzhSpL2",
    filename: filename,
    data_string: ()=>jsPsych.data.get().csv(),
    success_callback: function() {
        console.log('Data saved successfully');
    },
    error_callback: function(error) {
        console.error('Error saving data:', error);
    }
};

// Main experiment function
async function runExperiment() {
    try {
        // Load trials from CSV
        const trialsData = await loadTrials();
        console.log('Loaded trials:', trialsData.length); // Debug log
        
        if (trialsData.length === 0) {
            console.error('No trials loaded!');
            return;
        }

        // Create timeline
        const timeline = [
            consent,
            pid,
            instructions,
            ...createTrials(trialsData),
            save_data

        ];

        console.log('Timeline created with', timeline.length, 'items'); // Debug log

        // Run the experiment
        await jsPsych.run(timeline);
    } catch (error) {
        console.error('Error running experiment:', error);
    }
}

// Start the experiment when the page loads
runExperiment();

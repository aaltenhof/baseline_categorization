// Generate participant ID at the start
let participant_id = `participant${Math.floor(Math.random() * 999) + 1}`;

// Function to get URL parameters
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Get MTurk Worker ID from URL
const workerId = getUrlParam('workerId');
if (!workerId) {
    console.error('No worker ID found in URL');
}

// Initialize jsPsych with MTurk worker ID
const jsPsych = initJsPsych({
    on_finish: function() {
        console.log('Experiment finished');
        console.log('Worker ID:', workerId);
        console.log('Number of trials:', jsPsych.data.get()
            .filter({trial_type: 'image-button-response'})
            .count());
    }
});

// Generate participant ID
async function generateParticipantId() {
    const baseId = Math.floor(Math.random() * 999) + 1;
    return `participant${baseId}`;
}

// Add participant ID to all data
jsPsych.data.addProperties({
    participant_id: participant_id,
    worker_id: workerId,
    condition: null  // This will be updated when we get the condition
});


// Function to generate completion code
async function getCompletionCode() {
    try {
        const response = await fetch('http://sapir.psych.wisc.edu/~steve/KeyGenQualtrics.php');
        const code = await response.text();
        return code.trim();
    } catch (error) {
        console.error('Error generating completion code:', error);
        // Fallback code generation if the PHP script fails
        const random = Math.random().toString(36).substring(2, 15);
        return `MTzvz${random}`;
    }
}

// Function to create image path
function getImagePath(stimName) {
    return `stimuli/visual/${stimName}.png`;
}

async function getCompletionCode() {
    try {
        const response = await fetch('http://sapir.psych.wisc.edu/~steve/KeyGenQualtrics.php');
        const code = await response.text();
        return code.trim();
    } catch (error) {
        console.error('Error generating completion code:', error);
        // Fallback code generation if the PHP script fails
        const random = Math.random().toString(36).substring(2, 15);
        return `MTzvz${random}`;
    }
}

// Completion code and redirect trial
const completion_code = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: async function() {
        const code = await getCompletionCode();
        
        // Store the code in jsPsych data
        jsPsych.data.addProperties({
            completion_code: code
        });

        // Construct the Qualtrics URL with the code as a parameter
        const qualtricsUrl = `https://uwmadison.co1.qualtrics.com/jfe/form/SV_a9GuS8KJgA1mJTg?completion_code=${code}`;

        return `
            <p>You have completed the main experiment!</p>
            <p>Your completion code is: <strong>${code}</strong></p>
            <p>Please make a note of this code in case there are any technical issues.</p>
            <p>You will now be redirected to a brief survey.</p>
            <p>Press any key to continue to the survey.</p>
        `;
    },
    on_finish: function() {
        // Get the code we stored
        const code = jsPsych.data.get().last(1).values()[0].completion_code;
        // Redirect to Qualtrics with the code
        window.location.href = `https://uwmadison.co1.qualtrics.com/jfe/form/SV_a9GuS8KJgA1mJTg?completion_code=${code}`;
    }
};

// Function to load trials
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

        // Log the first trial to check structure
        console.log('Sample trial structure:', results.data[0]);

        // Shuffle the trials
        let shuffledData = [...results.data];
        for (let i = shuffledData.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledData[i], shuffledData[j]] = [shuffledData[j], shuffledData[i]];
        }
        
        // Update trial numbers to match new order
        shuffledData = shuffledData.map((trial, index) => ({
            ...trial,
            trial_num: index
        }));
        
        return shuffledData;
    } catch (error) {
        console.error('Error loading trials:', error);
        return [];
    }
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
            stimulus: function() {
                const imgPath = getImagePath(trial.top_stim);
                console.log('Loading top stimulus:', imgPath);
                return `
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">
                        <img src="${imgPath}" 
                             style="max-width:200px; max-height:200px;" 
                             id="stimulus-image">
                        <div style="height: 200px;"></div>
                    </div>
                `;
            },
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
            choices: choiceStims.map(stim => {
                const imgPath = getImagePath(stim.stim);
                console.log('Loading choice stimulus:', imgPath);
                return '<img src="' + imgPath + '" style="max-width:200px; max-height:200px;">';
            }),
            response_ends_trial: true,
            post_trial_gap: 500,
            data: {
                subCode: worker_id,
                trial_num: trial.trial_num,
                condition: trial.condition,
                top_stim: trial.top_stim,
                top_cat: trial.top_cat,
                left_stim: choiceStims[0].stim,
                left_cat: choiceStims[0].cat,
                middle_stim: choiceStims[1].stim,
                middle_cat: choiceStims[1].cat,
                right_stim: choiceStims[2].stim,
                right_cat: choiceStims[2].cat,
                orig_left_stim: trial.left_stim,
                orig_left_cat: trial.left_cat,
                orig_middle_stim: trial.middle_stim,
                orig_middle_cat: trial.middle_cat,
                orig_right_stim: trial.right_stim,
                orig_right_cat: trial.right_cat
            },
            on_finish: function(data) {
                // Use the shuffled positions for response recording
                const response_stim = choiceStims[data.response].stim;
                const response_cat = choiceStims[data.response].cat;
                
                // Add these properties to the data object
                data.response_stim = response_stim;
                data.response_cat = response_cat;
                data.rt = Math.round(data.rt);
                data.trial_part = 'choice';
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
        <p>At the end, there will be a survey, after which you will receive your completion code.</p>
        <p>The study will take about TIME minutes.</p>
        <p>Press any key when you are ready to continue.</p>
    `
};

const consent = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div style="width: 800px; margin: 0 auto; text-align: left">
            <h3>Consent to Participate in Research</h3>
            
            <p>The task you are about to do is sponsored by University of Wisconsin-Madison. It is part of a protocol titled "What are we learning from language?".</p>

            <p>The task you are asked to do involves making simple responses to words and sentences. For example, you may be asked to rate a pair of words on their similarity or to indicate how true you think a given sentence is. More detailed instructions for this specific task will be provided on the next screen.</p>

            <p>This task has no direct benefits. We do not anticipate any psychosocial risks. There is a risk of a confidentiality breach. Participants may become fatigued or frustrated due to the length of the study.</p>

            <p>The responses you submit as part of this task will be stored on a sercure server and accessible only to researchers who have been approved by UW-Madison. Processed data with all identifiers removed could be used for future research studies or distributed to another investigator for future research studies without additional informed consent from the subject or the legally authorized representative.</p>

            <p>You are free to decline to participate, to end participation at any time for any reason, or to refuse to answer any individual question without penalty or loss of earned compensation. We will not retain data from partial responses. If you would like to withdraw your data after participating, you may send an email lupyan@wisc.edu or complete this form which will allow you to make a request anonymously.</p>

            <p>If you have any questions or concerns about this task please contact the principal investigator: Prof. Gary Lupyan at lupyan@wisc.edu.</p>

            <p>If you are not satisfied with response of the research team, have more questions, or want to talk with someone about your rights as a research participant, you should contact University of Wisconsin's Education Research and Social & Behavioral Science IRB Office at 608-263-2320.</p>

            <p><strong>By clicking the box below, I consent to participate in this task and affirm that I am at least 18 years old.</strong></p>
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

// Fullscreen trials
const fullscreen_trial = {
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    delay_after: 0,
    button_label: null,
    message: null
};

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
        <p>You will now be redirected to a brief survey, after which you will receive your completion code.</p>
        <p>Press any key to continue.</p>
    `,
    on_finish: function() {
        window.location = "https://uwmadison.co1.qualtrics.com/jfe/form/SV_a9GuS8KJgA1mJTg";
    }
};

// Function to filter and format data for saving
function getFilteredData() {
    const allData = jsPsych.data.get().values();
    
    // Filter choice trials
    const choiceTrials = allData.filter(trial => 
        trial.trial_type === 'image-button-response' && 
        trial.top_stim !== undefined
    );
    
    // Map to array of objects with specific field order
    const formattedData = choiceTrials.map(trial => ({
        subCode: worker_id,
        condition: trial.condition,
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
        response_stim: trial.response_stim,
        response_cat: trial.response_cat
    }));

    // Convert to CSV string manually to ensure proper formatting
    const headers = Object.keys(formattedData[0]).join(',');
    const rows = formattedData.map(trial => 
        Object.values(trial).map(value => 
            typeof value === 'string' ? `"${value}"` : value
        ).join(',')
    );
    
    return headers + '\n' + rows.join('\n');
}


// Configure data saving
const save_data = {
    type: jsPsychPipe,
    action: "save",
    experiment_id: "cSLwXHzhSpL2",
    filename: `${worker_id}.csv`,
    data_string: getFilteredData,
    success_callback: function() {
        console.log('Data saved successfully to DataPipe');
        jsPsych.data.addProperties({
            completed: true
        });
    },
    error_callback: function(error) {
        console.error('Error saving to DataPipe:', error);
    }
};

async function runExperiment() {
    try {
        // Get condition from DataPipe
        const condition = await jsPsychPipe.getCondition("cSLwXHzhSpL2");
        console.log('Assigned condition:', condition);
        
        // Update the condition in the data
        jsPsych.data.addProperties({
            condition: condition
        });

        // Load trials
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
            {
                type: jsPsychPreload,
                images: function() {
                    const allImages = [];
                    trialsData.forEach(trial => {
                        allImages.push(getImagePath(trial.top_stim));
                        allImages.push(getImagePath(trial.left_stim));
                        allImages.push(getImagePath(trial.middle_stim));
                        allImages.push(getImagePath(trial.right_stim));
                    });
                    return allImages;
                }
            },
            instructions,
            ...createTrials(trialsData),
            save_data,
            end_fullscreen,
            completion_code 
        ];

        // Run the experiment
        await jsPsych.run(timeline);
    } catch (error) {
        console.error('Error running experiment:', error);
    }
}

// Start the experiment when the page loads
runExperiment();
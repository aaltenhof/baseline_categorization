var jsPsychSurveyMultiChoice = (function (jspsych) {
  'use strict';

  var version = "2.0.1";

  const info = {
    name: "survey-multi-choice",
    version,
    parameters: {
      /**
       * An array of objects, each object represents a question that appears on the screen. Each object contains a prompt,
       * options, required, and horizontal parameter that will be applied to the question. See examples below for further
       * clarification.`prompt`: Type string, default value is *undefined*. The string is prompt/question that will be
       * associated with a group of options (radio buttons). All questions will get presented on the same page (trial).
       * `options`: Type array, defualt value is *undefined*. An array of strings. The array contains a set of options to
       * display for an individual question.`required`: Type boolean, default value is null. The boolean value indicates
       * if a question is required('true') or not ('false'), using the HTML5 `required` attribute. If this parameter is
       * undefined, the question will be optional. `horizontal`:Type boolean, default value is false. If true, then the
       * question is centered and the options are displayed horizontally. `name`: Name of the question. Used for storing
       * data. If left undefined then default names (`Q0`, `Q1`, `...`) will be used for the questions.
       */
      questions: {
        type: jspsych.ParameterType.COMPLEX,
        array: true,
        nested: {
          /** Question prompt. */
          prompt: {
            type: jspsych.ParameterType.HTML_STRING,
            default: void 0
          },
          /** Array of multiple choice options for this question. */
          options: {
            type: jspsych.ParameterType.STRING,
            array: true,
            default: void 0
          },
          /** Whether or not a response to this question must be given in order to continue. */
          required: {
            type: jspsych.ParameterType.BOOL,
            default: false
          },
          /** If true, then the question will be centered and options will be displayed horizontally. */
          horizontal: {
            type: jspsych.ParameterType.BOOL,
            default: false
          },
          /** Name of the question in the trial data. If no name is given, the questions are named Q0, Q1, etc. */
          name: {
            type: jspsych.ParameterType.STRING,
            default: ""
          }
        }
      },
      /**
       * If true, the display order of `questions` is randomly determined at the start of the trial. In the data object,
       * `Q0` will still refer to the first question in the array, regardless of where it was presented visually.
       */
      randomize_question_order: {
        type: jspsych.ParameterType.BOOL,
        default: false
      },
      /** HTML formatted string to display at the top of the page above all the questions. */
      preamble: {
        type: jspsych.ParameterType.HTML_STRING,
        default: null
      },
      /** Label of the button. */
      button_label: {
        type: jspsych.ParameterType.STRING,
        default: "Continue"
      },
      /**
       * This determines whether or not all of the input elements on the page should allow autocomplete. Setting
       * this to true will enable autocomplete or auto-fill for the form.
       */
      autocomplete: {
        type: jspsych.ParameterType.BOOL,
        default: false
      }
    },
    data: {
      /** An object containing the response for each question. The object will have a separate key (variable) for each question, with the first question in the trial being recorded in `Q0`, the second in `Q1`, and so on. The responses are recorded as integers, representing the position selected on the likert scale for that question. If the `name` parameter is defined for the question, then the response object will use the value of `name` as the key for each question. This will be encoded as a JSON string when data is saved using the `.json()` or `.csv()` functions. */
      response: {
        type: jspsych.ParameterType.OBJECT
      },
      /** The response time in milliseconds for the participant to make a response. The time is measured from when the questions first appear on the screen until the participant's response(s) are submitted. */
      rt: {
        type: jspsych.ParameterType.INT
      },
      /** An array with the order of questions. For example `[2,0,1]` would indicate that the first question was `trial.questions[2]` (the third item in the `questions` parameter), the second question was `trial.questions[0]`, and the final question was `trial.questions[1]`. This will be encoded as a JSON string when data is saved using the `.json()` or `.csv()` functions. */
      question_order: {
        type: jspsych.ParameterType.INT,
        array: true
      }
    }
  };
  class SurveyMultiChoicePlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }
    static {
      this.info = info;
    }
    trial(display_element, trial) {
      var plugin_id_name = "jspsych-survey-multi-choice";
      var html = "";
      html += '<style id="jspsych-survey-multi-choice-css">';
      html += ".jspsych-survey-multi-choice-question { margin-top: 2em; margin-bottom: 2em; text-align: left; }.jspsych-survey-multi-choice-text span.required {color: darkred;}.jspsych-survey-multi-choice-horizontal .jspsych-survey-multi-choice-text {  text-align: center;}.jspsych-survey-multi-choice-option { line-height: 2; }.jspsych-survey-multi-choice-horizontal .jspsych-survey-multi-choice-option {  display: inline-block;  margin-left: 1em;  margin-right: 1em;  vertical-align: top;}label.jspsych-survey-multi-choice-text input[type='radio'] {margin-right: 1em;}";
      html += "</style>";
      if (trial.preamble !== null) {
        html += '<div id="jspsych-survey-multi-choice-preamble" class="jspsych-survey-multi-choice-preamble">' + trial.preamble + "</div>";
      }
      if (trial.autocomplete) {
        html += '<form id="jspsych-survey-multi-choice-form">';
      } else {
        html += '<form id="jspsych-survey-multi-choice-form" autocomplete="off">';
      }
      var question_order = [];
      for (var i = 0; i < trial.questions.length; i++) {
        question_order.push(i);
      }
      if (trial.randomize_question_order) {
        question_order = this.jsPsych.randomization.shuffle(question_order);
      }
      for (var i = 0; i < trial.questions.length; i++) {
        var question = trial.questions[question_order[i]];
        var question_id = question_order[i];
        var question_classes = ["jspsych-survey-multi-choice-question"];
        if (question.horizontal) {
          question_classes.push("jspsych-survey-multi-choice-horizontal");
        }
        html += '<div id="jspsych-survey-multi-choice-' + question_id + '" class="' + question_classes.join(" ") + '"  data-name="' + question.name + '">';
        html += '<p class="jspsych-survey-multi-choice-text survey-multi-choice">' + question.prompt;
        if (question.required) {
          html += "<span class='required'>*</span>";
        }
        html += "</p>";
        for (var j = 0; j < question.options.length; j++) {
          var option_id_name = "jspsych-survey-multi-choice-option-" + question_id + "-" + j;
          var input_name = "jspsych-survey-multi-choice-response-" + question_id;
          var input_id = "jspsych-survey-multi-choice-response-" + question_id + "-" + j;
          var required_attr = question.required ? "required" : "";
          html += '<div id="' + option_id_name + '" class="jspsych-survey-multi-choice-option">';
          html += '<label class="jspsych-survey-multi-choice-text" for="' + input_id + '">';
          html += '<input type="radio" name="' + input_name + '" id="' + input_id + '" value="' + question.options[j] + '" ' + required_attr + "></input>";
          html += question.options[j] + "</label>";
          html += "</div>";
        }
        html += "</div>";
      }
      html += '<input type="submit" id="' + plugin_id_name + '-next" class="' + plugin_id_name + ' jspsych-btn"' + (trial.button_label ? ' value="' + trial.button_label + '"' : "") + "></input>";
      html += "</form>";
      display_element.innerHTML = html;
      document.querySelector("form").addEventListener("submit", (event) => {
        event.preventDefault();
        var endTime = performance.now();
        var response_time = Math.round(endTime - startTime);
        var question_data = {};
        for (var i2 = 0; i2 < trial.questions.length; i2++) {
          var match = display_element.querySelector("#jspsych-survey-multi-choice-" + i2);
          var id = "Q" + i2;
          var val;
          if (match.querySelector("input[type=radio]:checked") !== null) {
            val = match.querySelector("input[type=radio]:checked").value;
          } else {
            val = "";
          }
          var obje = {};
          var name = id;
          if (match.attributes["data-name"].value !== "") {
            name = match.attributes["data-name"].value;
          }
          obje[name] = val;
          Object.assign(question_data, obje);
        }
        var trial_data = {
          rt: response_time,
          response: question_data,
          question_order
        };
        this.jsPsych.finishTrial(trial_data);
      });
      var startTime = performance.now();
    }
    simulate(trial, simulation_mode, simulation_options, load_callback) {
      if (simulation_mode == "data-only") {
        load_callback();
        this.simulate_data_only(trial, simulation_options);
      }
      if (simulation_mode == "visual") {
        this.simulate_visual(trial, simulation_options, load_callback);
      }
    }
    create_simulation_data(trial, simulation_options) {
      const question_data = {};
      let rt = 1e3;
      for (const q of trial.questions) {
        const name = q.name ? q.name : `Q${trial.questions.indexOf(q)}`;
        question_data[name] = this.jsPsych.randomization.sampleWithoutReplacement(q.options, 1)[0];
        rt += this.jsPsych.randomization.sampleExGaussian(1500, 400, 1 / 200, true);
      }
      const default_data = {
        response: question_data,
        rt,
        question_order: trial.randomize_question_order ? this.jsPsych.randomization.shuffle([...Array(trial.questions.length).keys()]) : [...Array(trial.questions.length).keys()]
      };
      const data = this.jsPsych.pluginAPI.mergeSimulationData(default_data, simulation_options);
      this.jsPsych.pluginAPI.ensureSimulationDataConsistency(trial, data);
      return data;
    }
    simulate_data_only(trial, simulation_options) {
      const data = this.create_simulation_data(trial, simulation_options);
      this.jsPsych.finishTrial(data);
    }
    simulate_visual(trial, simulation_options, load_callback) {
      const data = this.create_simulation_data(trial, simulation_options);
      const display_element = this.jsPsych.getDisplayElement();
      this.trial(display_element, trial);
      load_callback();
      const answers = Object.entries(data.response);
      for (let i = 0; i < answers.length; i++) {
        this.jsPsych.pluginAPI.clickTarget(
          display_element.querySelector(
            `#jspsych-survey-multi-choice-response-${i}-${trial.questions[i].options.indexOf(
            answers[i][1]
          )}`
          ),
          (data.rt - 1e3) / answers.length * (i + 1)
        );
      }
      this.jsPsych.pluginAPI.clickTarget(
        display_element.querySelector("#jspsych-survey-multi-choice-next"),
        data.rt
      );
    }
  }

  return SurveyMultiChoicePlugin;

})(jsPsychModule);

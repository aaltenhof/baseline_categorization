var jsPsychImageGridSelect = (function (jspsych) {
  'use strict';

  const info = {
    name: 'image-grid-select',
    parameters: {
      stimulus_folder: {
        type: jspsych.ParameterType.STRING,
        default: undefined
      },
      required_clicks: {
        type: jspsych.ParameterType.INT,
        default: 2
      },
      images_per_row: {
        type: jspsych.ParameterType.INT,
        default: 2
      },
      grid_spacing: {
        type: jspsych.ParameterType.INT,
        default: 20
      },
      prompt: {
        type: jspsych.ParameterType.HTML_STRING,
        default: null
      },
      max_image_width: {
        type: jspsych.ParameterType.INT,
        default: 300
      }
    }
  };

  class ImageGridSelectPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    calculateOptimalDimensions(containerWidth, imagesPerRow, gridSpacing, maxWidth) {
      // Account for grid spacing in width calculations
      const totalSpacing = gridSpacing * (imagesPerRow - 1);
      const availableWidth = containerWidth - totalSpacing;
      const imageWidth = Math.min(
        Math.floor(availableWidth / imagesPerRow),
        maxWidth
      );
      return imageWidth;
    }

    trial(display_element, trial) {
      let clicked = 0;
      const responses = [];
      const start_time = performance.now();

      // Clear display
      display_element.innerHTML = '';

      // Create a responsive container
      const container = document.createElement('div');
      container.style.width = '95vw'; // Use viewport width with margin
      container.style.maxWidth = '1200px'; // Maximum width for very large screens
      container.style.margin = '0 auto';
      container.style.padding = '20px';
      display_element.appendChild(container);

      // Add prompt if there is one
      if (trial.prompt !== null) {
        container.innerHTML += trial.prompt;
      }

      // Add grid container with responsive settings
      const gridContainer = document.createElement('div');
      gridContainer.style.display = 'grid';
      gridContainer.style.gap = trial.grid_spacing + 'px';
      gridContainer.style.gridTemplateColumns = `repeat(auto-fit, minmax(200px, 1fr))`;
      gridContainer.style.margin = '20px auto';
      gridContainer.style.justifyContent = 'center';
      container.appendChild(gridContainer);

      const folderName = trial.stimulus_folder.replace('stimuli/', '');

      // Function to handle window resize
      const handleResize = () => {
        const imageWidth = this.calculateOptimalDimensions(
          container.clientWidth,
          trial.images_per_row,
          trial.grid_spacing,
          trial.max_image_width
        );
        
        // Update all images in the grid
        const images = gridContainer.getElementsByTagName('img');
        for (let img of images) {
          img.style.width = imageWidth + 'px';
          img.style.height = 'auto'; // Maintain aspect ratio
        }
      };

      // Add resize event listener
      window.addEventListener('resize', handleResize);

      // Load images
      fetch(`http://localhost:3000/get-images/${folderName}`)
        .then(response => response.json())
        .then(imagePaths => {
          // Create a promise for each image load
          const imageLoadPromises = imagePaths.map(path => {
            return new Promise((resolve, reject) => {
              const img = document.createElement('img');
              img.src = path;
              img.style.width = '100%';
              img.style.height = 'auto';
              img.style.cursor = 'pointer';
              img.style.transition = 'transform 0.2s ease';
              
              // Add hover effect
              img.addEventListener('mouseenter', () => {
                if (clicked < trial.required_clicks) {
                  img.style.transform = 'scale(1.05)';
                }
              });
              
              img.addEventListener('mouseleave', () => {
                img.style.transform = 'scale(1)';
              });

              img.addEventListener('click', () => {
                if (clicked < trial.required_clicks) {
                  clicked++;
                  const rt = Math.round(performance.now() - start_time);
                  const filename = path.split('/').pop();

                  // Visual feedback on click
                  img.style.border = '3px solid #4CAF50';
                  img.style.transform = 'scale(1)';
                  img.style.pointerEvents = 'none'; // Prevent multiple clicks

                  // Store response data
        responses.push({
          rt: rt,
          participant_id: trial.data.participant_id,
          prolific_id: trial.data.prolific_id,
          category: folderName,
          trial_number: trial.data.trial_number,
          image_name: filename,
          click_order: clicked
      });

      if (clicked === trial.required_clicks) {
          setTimeout(() => {
              window.removeEventListener('resize', handleResize);
              display_element.innerHTML = '';
              
              // Send all collected data
              this.jsPsych.finishTrial({
                  participant_id: trial.data.participant_id,
                  prolific_id: trial.data.prolific_id,
                  trial_number: trial.data.trial_number,
                  category: folderName,
                  responses: responses
              });
          }, 300);
                  }
                }
              });

              img.onload = () => resolve(img);
              img.onerror = reject;
            });
          });

          // When all images are loaded, add them to the grid
          Promise.all(imageLoadPromises)
            .then(images => {
              images.forEach(img => gridContainer.appendChild(img));
              // Initial resize handling
              handleResize();
            })
            .catch(error => {
              console.error('Error loading images:', error);
              display_element.innerHTML = 'Error loading images. Please try again.';
            });
        });
    }
  }

  ImageGridSelectPlugin.info = info;
  return ImageGridSelectPlugin;
})(jsPsychModule);
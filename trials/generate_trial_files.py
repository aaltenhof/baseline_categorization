import glob, os, random, sys

import pandas as pd
import random
import numpy as np
import random
import generate_trials
import csv 
import os
from itertools import combinations, permutations

def Convert(tup, di):
    for a, b in tup:
        di.setdefault(a, []).append(b)
    return di

# UPDATE to take 
def generateTrials(runTimeVars,runTimeVarsOrder):
	directory = "stimuli/visual"
	all_images = []

	for image_file in os.listdir(directory):
		i = os.path.join(directory, image_file)
		all_images.append((i.replace("stimuli/visual\\", '')).replace('.png', '')) # for in lab version
		#all_images.append((i.replace("stimuli/visual/", '')).replace('.png', ''))

	#print(all_images)

	
	all_possible_triads = list(permutations(all_images, 3))
	# print(all_possible_triads)

	# get this to update dynamically 
	condition = 1

	all_possible_quads= generate_trials.get_quads(all_possible_triads, condition)
	# print(all_possible_triads)

    # write files for other trial types
	trial_type_list = ['quad','learning', 'testing', 'forcedchoice']
	label_pairing = all_possible_labels[int(runTimeVars['cat_list'])]
	label_dict = {}
	label_dict = Convert(label_pairing, label_dict)

	# print(label_pairing)
			
	trial_num = 0
	all_trials = []
	
	for trial in all_possible_quads: 
		single_trial_dict = {}
		single_trial_dict['subCode'] = runTimeVars['subjCode']
		single_trial_dict['condition'] = runTimeVars['condition']
		single_trial_dict['expName'] = "baseline_contrast"
		single_trial_dict['trial_num'] = trial_num
			
		single_trial_dict['top_stim'] = trial['quad'][0]
		single_trial_dict['top_cat'] = trial['cat'][0]
		single_trial_dict['right_stim'] = trial['quad'][1]
		single_trial_dict['right_cat'] = trial['cat'][1]
		single_trial_dict['middle_stim'] = trial['quad'][2]
		single_trial_dict['middle_cat'] = trial['cat'][2]
		single_trial_dict['left_stim'] = trial['quad'][3]
		single_trial_dict['left_cat'] = trial['cat'][3]
		
		trial_num = trial_num + 1
		all_trials.append(single_trial_dict)
		keys = all_trials[0].keys()	
		
		# write to file
		filename = "trials/" + str(runTimeVars['subjCode']) + "_baseline_trials.csv"
		with open(filename, 'w', newline='') as output_file:
			dict_writer = csv.DictWriter(output_file, keys)
			dict_writer.writeheader()
			dict_writer.writerows(all_trials)
        		
		
	return label_dict


import os
import re
import random
from itertools import permutations


def get_category_info (shape, condition):
    # define cateogries
    if condition == "1":
        # print ("condition is: " + condition + ". Should be 1")
        a = ["VCS_360", "VCS_10","VCS_20","VCS_30","VCS_40","VCS_50","VCS_60", "VCS_70"]
        b = ["VCS_90", "VCS_100","VCS_110","VCS_120","VCS_130","VCS_140","VCS_150", "VCS_160"]
        c = ["VCS_180","VCS_190", "VCS_200", "VCS_210","VCS_220","VCS_230","VCS_240","VCS_250"]
        d = ["VCS_270", "VCS_280","VCS_290","VCS_300","VCS_310","VCS_320","VCS_330", "VCS_340"]
    elif condition == "2":
        # print ("condition is: " + condition + ". Should be 2")
        a = ["VCS_60", "VCS_70", "VCS_80", "VCS_90", "VCS_100", "VCS_110", "VCS_120", "VCS_130"]
        b = ["VCS_150", "VCS_160", 'VCS_170', "VCS_180", "VCS_190", "VCS_200", "VCS_210", "VCS_220"]
        c = ["VCS_240","VCS_250", "VCS_260", "VCS_270", "VCS_280", "VCS_290", "VCS_300", "VCS_310"]
        d = ["VCS_330", "VCS_340", "VCS_350", "VCS_360", "VCS_10", "VCS_20", "VCS_30", "VCS_40"]

    elif condition == "3":
        # print ("condition is: " + condition + ". Should be 3")
        a = ["VCS_20","VCS_30","VCS_40","VCS_50","VCS_60", "VCS_70", "VCS_80", "VCS_90"]
        b = ["VCS_110","VCS_120","VCS_130","VCS_140","VCS_150", "VCS_160", 'VCS_170', "VCS_180"]
        c = ["VCS_200", "VCS_210","VCS_220","VCS_230","VCS_240","VCS_250", "VCS_260", "VCS_270"]
        d = ["VCS_290","VCS_300","VCS_310","VCS_320","VCS_330", "VCS_340", "VCS_350", "VCS_360"]
    else:
        # print ("condition is: " + condition + ". Should be 4")
        a = ["VCS_40","VCS_50","VCS_60", "VCS_70", "VCS_80", "VCS_90", "VCS_100", "VCS_110"]
        b = ["VCS_130","VCS_140","VCS_150", "VCS_160", 'VCS_170', "VCS_180", "VCS_190", "VCS_200"]
        c = ["VCS_220","VCS_230","VCS_240","VCS_250", "VCS_260", "VCS_270", "VCS_280", "VCS_290"]
        d = ["VCS_310","VCS_320","VCS_330", "VCS_340", "VCS_350", "VCS_360", "VCS_10", "VCS_20"]

    
    all_cats = [a,b,c,d]
    
    if shape in a: 
        category = 'a'
        if shape == a[0] or shape == a[1] or shape == a[6] or shape == a[7]:
            location = 'outer'
        else:
            location = 'inner'
    elif shape in b:
        category = 'b'
        if shape == b[0] or shape == b[1] or shape == b[6] or shape == b[7]:
            location = 'outer'
        else:
            location = 'inner'
    elif shape in c:
        category = 'c'
        if shape == c[0] or shape == c[1] or shape == c[6] or shape == c[7]:
            location = 'outer'
        else:
            location = 'inner'
    elif shape in d:
        category = 'd'
        if shape == d[0] or shape == d[1] or shape == d[6] or shape == d[7]:
            location = 'outer'
        else:
            location = 'inner'
    else:
        # or flag that it doesn't have a category
        category = 'NA'
        location = 'NA'

    return (category, location)
    


def get_forced_choice(all_images, condition):
    all_forced_choice = []
    for shape in all_images:
        # remove shapes not in a category 
        if get_category_info(shape, condition)[0] != "NA":
            all_forced_choice.append({'shape': shape, 'cat': get_category_info(shape, condition)[0], 'location': get_category_info(shape, condition)[1]})
    
    return all_forced_choice



def get_pairs(all_possible_pairs, contrast1, contrast2, condition):
    learning_trials = []
    testing_trials = []
    for i,pair in enumerate(all_possible_pairs):
        # print (pair)
        pair_cats = [get_category_info(pair[0], condition)[0], get_category_info(pair[1], condition)[0]]
        # print (pair_cats)
        pair_locations = [get_category_info(pair[0], condition)[1], get_category_info(pair[1], condition)[1]]
        # print (pair_locations)

        # only keep pairs that have shapes that belong to categories and remove same cateogry pairings
        if ('NA' not in pair_cats and len(set(pair_cats)) != 1):
            # only keep ab and cd trials - FIX 
            if (set(pair_cats) == contrast1 or set(pair_cats) == contrast2):
                # only keep pairs between inner cateogry memebers for learning  
                if (set(pair_locations) == {"inner"}):
                    # print (pair_cats)
                    # print(pair_locations)
                    learning_trials.append({'pair': pair, 'comparison': ''.join(pair_cats), 'locations': pair_locations, 'correct_response': 'left'})
                    learning_trials.append({'pair': pair, 'comparison': ''.join(pair_cats), 'locations': pair_locations, 'correct_response': 'right'})
            
            #keep all pairs for test trials 
            #divide between right and left presentations 
            if i % 2 == 0: 
                testing_trials.append({'pair': pair, 'comparison': ''.join(pair_cats), 'locations': pair_locations, 'correct_response': 'right'})
            else:
                testing_trials.append({'pair': pair, 'comparison': ''.join(pair_cats), 'locations': pair_locations, 'correct_response': 'left'})
                

    # print (len(learning_trials))
    # print (len(testing_trials))
    
    return learning_trials, testing_trials


def get_quads(all_possible_triads, condition):
    acceptable_quads = []
    for triad in all_possible_triads:
        quad_shapes = [triad[0], triad[1], triad[2]]
        quad_cats = []
        quad_angles = []
        quad_locations = []
        # print(quad)
        for shape in triad:
            # print (shape)
            # save the angle of each shape
            angle = re.findall('\d+', shape)[0]
            # print (angle)
            quad_angles.append(int(angle))
            quad_cats.append(get_category_info(shape, condition)[0])
            quad_locations.append(get_category_info(shape, condition)[1])
        
        #print(quad_cats)
        # remove triads that contain shapes that don't belong to a category, outer stimuli, and within category comparisons
        if (('NA' not in quad_cats) and ('outer' not in quad_locations) and (len(quad_cats) == len(set(quad_cats)))):
            # print(triad)
            # print (triad_cats)
            # print (triad_angles)
            
            
            # find the shortest distance between the top stimuli angle and the right/left stimuli
            xa_og_diff = quad_angles[0] - quad_angles[1]
            xa_nearest_diff = abs((xa_og_diff + 180) % 360 - 180)
            # print (xa_nearest_diff)

            xb_og_diff = quad_angles[0] - quad_angles[2]
            xb_nearest_diff = abs((xb_og_diff + 180) % 360 - 180)
            # print(xb_nearest_diff)

            # check if the distance from item x to item a is +/- 10 the distance from item x to item b
            if (xb_nearest_diff == xa_nearest_diff):
                # print (triad_angles)
                # print (xa_nearest_diff)
                # print(xb_nearest_diff)

                # get orthogonal shape
                orthogonal_ang = ((quad_angles[0] + 180) % 360)
                # convert 0 angle to 360 
                if orthogonal_ang == 0:
                    orthogonal = "VCS_360"
                else:
                    orthogonal = "VCS_" + str(orthogonal_ang)
                orthogonal_cat = get_category_info(orthogonal, condition)

                # add information about orthogonal shape to the trial
                quad_shapes.append(orthogonal)
                quad_cats.append(orthogonal_cat[0])
                #print(quad_shapes)
                #print(quad_cats)

                # combine shape and category info to...
                quad_info = [i + j for i, j in zip(quad_shapes, quad_cats)]
                #print(quad_info)
                quad_copy = quad_info[1:]
                #print(quad_copy)

                # shuffle for all possible orders for non top-stim
                shuffled_quads = [list(elem) for elem in list(permutations(quad_copy, 3))]
                #print(shuffled_quads)
                random.shuffle(shuffled_quads)
                #print(shuffled_quads)
                half_quads = shuffled_quads[:3]
                # print(half_quads)

                
                for orders in half_quads:
                    bottom_shapes = []
                    bottom_cats = []
                    for item in orders:
                        bottom_shapes.append(item[:-1])
                        bottom_cats.append(item[-1])
                    

                    # print(orders)
                    bottom_shapes.insert(0, quad_info[0][:-1])
                    bottom_cats.insert(0,quad_info[0][-1])
                    #print(bottom_cats)
                    #print(bottom_shapes)

                    acceptable_quads.append({'quad': bottom_shapes, 'cat': bottom_cats})

    # print statement to check if bottom shuffling works      
    #i = 0
    #while (i < 7):
        #print(acceptable_quads[i])
       #i = i + 1

    return acceptable_quads

# print(len(get_triads()))
# get_pairs()


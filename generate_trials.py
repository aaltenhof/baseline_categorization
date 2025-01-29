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
            #print (angle)
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
                print(quad_info)
                
                for item in quad_info:
                    shapes = []
                    cats = []
                    for item in quad_info: 
                        match = re.match(r"(VCS_\d+)([a-zA-Z]?)", item)
                        shapes.append(match.group(1))
                        cats.append(match.group(1))

                    acceptable_quads.append({'quad': shapes, 'cat': cats})

    # print statement to check if bottom shuffling works      
    #i = 0
    #while (i < 7):
        #print(acceptable_quads[i])
       #i = i + 1

    return acceptable_quads

# print(len(get_triads()))
# get_pairs()


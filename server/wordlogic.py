import sys  
import csv
import random

# # Import the Warriner affective norms dataset
# # http://crr.ugent.be/archives/1003

# titles = ['holmes', 'pride', 'dracula', 'raven']
# warriner = {}
# vecs = {}
# models = 'models/'
# source_material = 'material/'

# with open(models+'warriner.csv', mode='r') as infile:
#     reader = csv.reader(infile)
#     next(reader)
#     warriner = {rows[1]: {'valence': (float)(rows[2]), 'arousal': (float)(rows[5]), 'dominance': (float)(rows[8])} for rows in reader}

# def getNTitles(fields, num):
#     N = len(titles)
#     maxval = 0
#     results = []
#     inputTags = [field['tag'] for field in fields]
#     weights = [{'tag': title, 'intensity': float(1)/N} for title in titles if title not in inputTags]
#     for field in fields:
#         increasedField = {'tag': field['tag'], 'intensity': float(1)/N + field['intensity']}
#         weights.append(increasedField)
#     weights = sorted(weights, key=lambda field: field['intensity'])
#     for field in weights: 
#         maxval += float(field['intensity'])
#     for i in range(num):
#         results.append(weighted_rng(weights, maxval))
#     return results

# # given fields, returns one based on prob. All start equal
# def weighted_rng(fields, maxval=0):
#     if maxval == 0:
#         for field in fields: 
#             maxval += float(field['intensity'])
#     rng = random.uniform(0, maxval)
#     curr = 0
#     for field in fields:
#         curr += float(field['intensity'])
#         if curr > rng:
#             return field['tag']

#     return fields[-1]['tag']

def search(json):
    fields = json['fields']
    keyword = json['keyword']

    return getNTitles(fields, 10)
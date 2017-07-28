import sys  
import csv
import random
#from gensim.models.keyedvectors import KeyedVectors
# from gensim.models import word2vec

# # reload(sys)  
# # sys.setdefaultencoding('utf8')

# # Import the Warriner affective norms dataset
# # http://crr.ugent.be/archives/1003

titles = ['holmes', 'pride', 'dracula', 'raven']
warriner = {}
vecs = {}
models = 'models/'
source_material = 'material/'
with open(models+'warriner.csv', mode='r') as infile:
    reader = csv.reader(infile)
    next(reader)
    warriner = {rows[1]: {'valence': (float)(rows[2]), 'arousal': (float)(rows[5]), 'dominance': (float)(rows[8])} for rows in reader}


# # Get vector models for every title
# for title in titles:
#     sentences = word2vec.Text8Corpus(source_material + title + ".txt")
#     vecs[title] = word2vec.Word2Vec(sentences, size=200, hs=1, negative=0)

# def search_word(model, word, dissimilarity=100):
#     return [w for w in model.similar_by_word(word, dissimilarity)]

# def search_word_affective(model, word, dissimilarity=100, prop='arousal', low=0, high=10):
#     return sorted([(warriner[w[0]][prop], w[0], w[1]) for w in model.similar_by_word(word, dissimilarity) if w[0] in warriner and high >= warriner[w[0]][prop] >= low], reverse=True)

def getNTitles(fields, num):
    N = len(titles)
    maxval = 0
    results = []
    inputTags = [field['tag'] for field in fields]
    weights = [{'tag': title, 'intensity': float(1)/N} for title in titles if title not in inputTags]
    for field in fields:
        increasedField = {'tag': field['tag'], 'intensity': float(1)/N + field['intensity']}
        weights.append(increasedField)
    weights = sorted(weights, key=lambda field: field['intensity'])
    for field in weights: 
        maxval += float(field['intensity'])
    for i in range(num):
        results.append(weighted_rng(weights, maxval))
    return results

# given fields, returns one based on prob. All start equal
def weighted_rng(fields, maxval=0):
    if maxval == 0:
        for field in fields: 
            maxval += float(field['intensity'])
    rng = random.uniform(0, maxval)
    curr = 0
    for field in fields:
        curr += float(field['intensity'])
        if curr > rng:
            return field['tag']

    return fields[-1]['tag']

def search(json):
    fields = json['fields']
    keyword = json['keyword']

    return getNTitles(fields, 10)
import csv
import re
import glob
from collections import defaultdict 
from collections import OrderedDict as od
import math
from collections import Counter
from textblob import TextBlob, Word
import sys  
from gensim.models import word2vec
from gensim.models.keyedvectors import KeyedVectors
reload(sys)  
sys.setdefaultencoding('utf8')

models = 'models/'
source_material = 'material/'

# Import the Warriner affective norms dataset
# http://crr.ugent.be/archives/1003

warriner = {}
with open(models+'warriner.csv', mode='r') as infile:
    reader = csv.reader(infile)
    next(reader)
    warriner = {rows[1]: {'valence': (float)(rows[2]), 'arousal': (float)(rows[5]), 'dominance': (float)(rows[8])} for rows in reader}

vecs = {}

titles = ['holmes', 'pride', 'dracula', 'raven']

# Get vector models for every title
for title in titles:
    sentences = word2vec.Text8Corpus(source_material + title + ".txt")
    vecs[title] = word2vec.Word2Vec(sentences, size=200, hs=1, negative=0)

def search_word(model, word, dissimilarity=100):
    return [w for w in model.similar_by_word(word, dissimilarity)]

def search_word_affective(model, word, dissimilarity=100, prop='arousal', low=0, high=10):
    return sorted([(warriner[w[0]][prop], w[0], w[1]) for w in model.similar_by_word(word, dissimilarity) if w[0] in warriner and high >= warriner[w[0]][prop] >= low], reverse=True)
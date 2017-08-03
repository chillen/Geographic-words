from wordtrackingmodels import WordModelCollection
import json
import csv
import re
import glob
import math
from collections import Counter, defaultdict

def loadFile(f):
    lines = []
    text = []
    with open(f, mode='r') as infile:
        lines = infile.readlines()
    started = False
    ended = False
    for line in lines:
        if not started:
            if '*** START' in line or '***START' in line:
                started = True
            continue
        if '*** END' in line or '***END' in line:
            break
        line = line.strip('\n')
        line = unicode(line, "ascii", errors="ignore")
        line =  re.sub("[^a-zA-Z]", " ", line)
        line = line.lower()
        text.extend(line.split())
    text = " ".join([w for w in text if suitableWord(w)])
    return text

def suitableWord(word):
    if len(word) < 2:
        return False
    if word in stops:
        return False
    if word not in english:
        return False
    if word in warriner and warriner[word]['arousal'] < 4:
        return False
    return True

def dbg(*message):
    """Print a debug message if debugging is on."""
    if not debugging:
        return False
    message = [str(m) for m in message]
    print '  [DBG] ', ''.join(message)

def loadModels(maxmodels=-1):
    models = []
    files = glob.glob('data/*.txt')
    maxmodels = maxmodels if maxmodels >0 else len(files)
    for i, f in enumerate(files[:maxmodels]):
        meta = getGutenbergMeta(f)
        dbg( '['+str(i)+'] Currently processing ', meta['title'], '...')
        models.append({'text': loadFile(f), 'meta': meta})
    return models

def loadWarriner():
    warriner = {}
    with open('models/warriner.csv', mode='r') as infile:
        reader = csv.reader(infile)
        next(reader)
        warriner = {rows[1]: {'valence': (float)(rows[2]), 'arousal': (float)(rows[5]), 'dominance': (float)(rows[8])} for rows in reader}
    return warriner

def getGutenbergMeta(f):
    data = {}
    with open(f) as infile:
        for line in infile.readlines():
            if line.startswith('Title: '):
                data['title'] = unicode(line[len('Title: '):].strip('\n'), "ascii", errors="ignore")
            if line.startswith('Author: '):
                data['author'] = unicode(line[len('Author: '):].strip('\n'), "ascii", errors="ignore")
    return data

def findClustersForWord(search, models, dist_away=2, exclusive=True):
    near = dist_away
    clusters = {}
    similarclusters = []
    for model in models:
        clusters[model] = set([word for word in models[model].getNearbyWordsInRange(search, near)])
        similarclusters = []
        for cluster1 in clusters:
            for cluster2 in clusters:
                if cluster1 != cluster2:
                    if len(clusters[cluster1] & clusters[cluster2]) > 2:
                        newclust = ((cluster1, clusters[cluster1]), (cluster2, clusters[cluster2]))
                        if (newclust[1], newclust[0]) not in similarclusters:
                            similarclusters.append(newclust)
    if not exclusive:
        return similarclusters
    else:
        return [((cluster[0][0], cluster[1][0]), cluster[0][1] & cluster[1][1] )for cluster in similarclusters]
def modelSimilarToWord(model, word, textlength, wordset):
    return 1000*math.log(1+model.getWord(word).getCount()/float(textlength))
    
def modelsMostSimilarToTerms(models, search):
    if isinstance(search, str): 
        search = [search]
    similars = {}
    for title in models:
        similars[title] = Counter()
        model = models[title]
        text = model.getText()
        numwords = len(text.split())
        wordset = set(text.split())
        for word in search:
            if word in wordset:
                similars[title].update({word: modelSimilarToWord(model, word, numwords, wordset)})
    sortedsums = sorted([(sum(similars[title].values()), title, similars[title].items()) for title in similars if len(similars[title].items()) != 0], reverse=True)
    return sortedsums
def findCommonClusters(models, dist_away=2, exclusive=True):
    wordsets = [set(models[title].getText().split()) for title in models]
    n = len(models)
    commonwords = set.intersection(*wordsets)
    commonclusters = {}
    for word in commonwords:
        found = findClustersForWord(word, models, dist_away, exclusive)
        if len(found) > 0:
            if word not in commonclusters:
                commonclusters[word] = []
            commonclusters[word].extend(found)
    # If there is n choose 2 entries, then all of them have commonalities with each other
    commonclusters = {word: commonclusters[word] for word in commonclusters if len(commonclusters[word]) >= n * (n-1) / 2}
    return commonclusters
def findCommonWordsInClusters(models, dist_away=2, exclusive=True, join='union'):
    commonclusters = findCommonClusters(models, dist_away, exclusive)
    wordsets = {}
    for word in commonclusters:
        wordsets[word] = commonclusters[word][0][1]
        for l in commonclusters[word]:
            if join == 'union':
                wordsets[word] = wordsets[word] | l[1]
            if join == 'intersection':
                wordsets[word] = wordsets[word] & l[1]
        if len(wordsets[word]) == 0:
            del wordsets[word]
    return wordsets

debugging = False
warriner = loadWarriner()
stops = set(json.load(open('data/nltkstopwords.json', 'r')))
english = set(json.load(open('data/english.json', 'r')))  

def search(json, collection):
    data = defaultdict(list)
    for k in json:
        data[k] = json[k]
    fields = data['fields']
    keywords = data['keywords']
    accept = data['accept']
    reject = data['reject']
    blacklist = data['blacklist']
    models = collection.getModels()
    
    response = modelsMostSimilarToTerms(models, keywords)
    response = [d[1] for d in response]
    print "test"
    return response

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

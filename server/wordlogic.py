from wordtrackingmodels import WordModelCollection
import json
import csv
import re
import glob
import random
from pprint import pprint
import operator
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

def nextWords(json, collection ,session):
    request = defaultdict(list)
    for k in json:
        request[k] = json[k]
    blacklist = request['blacklist']
    accept = request['accept']
    reject = request['reject']
    
    # Update words in the used list, so we can keep track of
    # Any used up words to avoid sending back and also
    # Potentially find clusters among accepted words.
    for word in accept:
        session['used'][word] = 'ACCEPT'
    for word in reject:
        session['used'][word] = 'REJECT'

    # Given the words they accepted, add one to every model which
    # Contains those words in the top 200 most important terms
    
    for title in collection.getModels():
        model = collection.getModels()[title]
        for word in accept:
            if model.getWord(word):
                session['field'][title] += math.log(model.getWord(word).getWeight())
        
        for word in reject:
            if model.getWord(word):
                session['field'][title] -= math.log(model.getWord(word).getWeight())

    response = set()
    field = session['field']
    titles = getNTitles(field, 10)
    for title in titles:
        important = collection.getModel(title).getMostImportant()[:50]
        for _ in range(100):
            word = random.choice(important)[1]
            if word not in session['used']:
                response.add(word)
                break

    for word in response:
        session['used'][word] = 'PASS'
    pprint(sorted(field.items(), key=operator.itemgetter(1), reverse=True)[:5])
    return {'response': list(response), 'session':  session}

def search(json, collection, session):
    request = defaultdict(list)
    for k in json:
        request[k] = json[k]
    keywords = request['keywords']

    models = collection.getModels()

    similarTitles = modelsMostSimilarToTerms(models, keywords)
    cleaned = {r[1]: r[0] for r in similarTitles}
    field = getFieldFromTitles(cleaned, collection)
    titles = getNTitles(field, 10)
    response = set()
    
    for _ in range(100):
        for title in titles:
            model = models[title]
            for word in keywords:
                words = model.getNearbyWordsInRange(word, 1,2)
                words = [(w, model.getWord(w).getWeight()) for w in words]
                words = sorted(words, key=lambda x: x[1], reverse=True)[:10]
                if len(words) > 0:
                    response.add(random.choice(words)[0])
                    if len(response) >= 10: 
                        break
            if len(response) >= 10: 
                break
        if len(response) >= 10: 
            break

    session['field'] = field
    session['used'] = {word: 'PASS' for word in response}
    return {'response': list(response), 'session':  session}

def getFieldFromTitles(works, collection):
    """Return a field given a set of titles"""
    field = {}
    titles = works.keys()
    for model in collection.getModels():
        strength = 1
        if model in titles:
            strength += works[model]
        field[model] = strength
    return field

def getNTitles(works, num):
    N = len(works)
    maxval = sum(works.values())
    minval = min(works.values())
    results = []
    for _ in range(num):
        results.append(weighted_rng(works, minval, maxval))
    return results

# given fields, returns one based on prob. All start equal
def weighted_rng(works, minval=999999, maxval=0):
    if maxval == 0:
        maxval = sum(works.values())
    if minval == 999999:
        maxval = min(works.values())
    rng = random.uniform(minval, maxval)
    curr = 0
    for title in works:
        curr += float(works[title])
        if curr > rng:
            return title
    return 'ERR'
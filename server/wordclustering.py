import csv
import re
import glob
import math
import json
import zlib
from pprint import pprint
from collections import Counter

class TrackedWord:
    def __init__(self, word):
        self.word = word
        self.nearby = {}
        self.count = 1
        self.weight = -1
    def __iadd__(self, other):
        self.count += other
        return self
    def addNear(self, N, word1):
        if N not in self.nearby:
            self.nearby[N] = Counter()
        if word1 != '':
            self.nearby[N][word1] += 1
    def near(self, N):
        '''Returns the words which are N away'''
        if N in self.nearby:
            return self.nearby[N]
        else:
            return Counter()
    def sumNear(self, N):
        '''Returns the sum of all words within the range 1-N'''
        if N in self.nearby:
            relevant = []
            for i in range(1, N+1):
                relevant.append(self.nearby[i])
            return reduce((lambda x, y: x + y), relevant)
    def getWeight(self):
        '''Returns tf-idf of the word'''
        if self.weight < 0:
            df = float(WordTrackModel.df[self.word])
            n = float(WordTrackModel.totalworks)
            self.weight = float(self.count) * math.log(n/df)
        return self.weight

class WordTrackModel:
    
    stops = set(json.load(open('data/nltkstopwords.json', 'r')))
    english = set(json.load(open('data/english.json', 'r')))
    totalworks = 0
    df = Counter()
    warriner = None

    with open('models/warriner.csv', mode='r') as infile:
        reader = csv.reader(infile)
        next(reader)
        warriner = {rows[1]: {'valence': (float)(rows[2]), 'arousal': (float)(rows[5]), 'dominance': (float)(rows[8])} for rows in reader}
    
    def __init__(self, name, f, data={}, filterwarriner=False):
        self.name = name
        self.f = f
        self.filterwarriner = filterwarriner
        self.text = self.loadfile(f)
        self.words = {}
        self.tracked = set([0])
        self.data = data
        WordTrackModel.totalworks += 1
    
    def loadfile(self, f):
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
        text = " ".join([w for w in text if self.suitableWord(w)])
        self.df.update(set(text.split()))
        return zlib.compress(text)
    
    def suitableWord(self, word):
        if word in self.stops:
            return False
        if word not in self.english:
            return False
        if self.filterwarriner:
            if word in WordTrackModel.warriner and WordTrackModel.warriner[word]['arousal'] < 4:
                return False
        return True

    def wordlist(self):
        return zlib.decompress(self.text).split()
    
    def distTrack(self, N):
        words = self.wordlist()
        if N in self.tracked:
            return self
        for i, word in enumerate(words):
            if word not in self.words:
                self.words[word] = TrackedWord(word)
            for j in range(N, 0, -1):
                if j in self.tracked:
                    break
                wNback = words[i-j] if i-j >= 0 else ''
                wNfor = words[i+j] if i+j < len(words) else ''
                self.words[word].addNear(j, wNback)
                self.words[word].addNear(j, wNfor)
                self.words[word] += 1
        for i in range(N, 0, -1):
            if i not in self.tracked:
                self.tracked.add(i)
            else:
                break
        return self
                
    def near(self, word, N, most=0):
        if N not in self.tracked:
            self.distTrack(N)
        if word in self.words:
            return self.words[word].near(N) if most <= 0 else self.words[word].near(N).most_common(most)
        else:
            return Counter() if most <= 0 else []
        
    def orderby(self, words, method, reverse=True):
        if method == 'frequency':
            return words.most_common()
        if method == 'importance':
            sortedwords = sorted([ (self.words[w].getWeight(), w) for w in words], reverse=reverse)
            return [(w[1], w[0]) for w in sortedwords]
        
    def sumNear(self, word, N, most=0, orderby='frequency'):
        if N not in self.tracked:
            self.distTrack(N)
        if word in self.words:
            nearby = self.words[word].sumNear(N)
            nearby = self.orderby(nearby, orderby)
            return nearby if most == 0 else nearby[:most]
        else:
            return []
    def most_common(self, N=-1):
        if N > 0: return Counter(self.wordlist()).most_common(N)
        return Counter(self.wordlist()).most_common()
    def most_important(self, maxnum=-1):
        words = set()
        for word in self.words:
            words.add((self.words[word].getWeight(), word))
        if maxnum > 0: return sorted(words, reverse=True)[:maxnum]
        return sorted(words, reverse=True)

class KnowledgeBase:
    def __init__(self, debugging=False, maxmodels=-1, warriner=False):
        self.debugging = debugging
        self.models = self.loadModels(maxmodels=maxmodels, warriner=warriner)
        
    def loadModels(self, maxmodels=-1, warriner=False):
        models = {}
        WordTrackModel.df = Counter()
        WordTrackModel.totalworks = 0
        files = glob.glob('data/*.txt')
        maxmodels = maxmodels if maxmodels >0 else len(files)
        for i, f in enumerate(files[:maxmodels]):
            data = self.getGutenbergMeta(f)
            if self.debugging:
                print '['+str(i)+'] Currently processing ', data, '...'
            models[data['title']] = WordTrackModel(data['title'], f, data, warriner)
            models[data['title']].distTrack(3)
        return models
    def getGutenbergMeta(self, f):
        data = {'title': 'xxx', 'author': 'xxx'}
        with open(f) as infile:
            for line in infile.readlines():
                if line.startswith('Title: '):
                    data['title'] = unicode(line[len('Title: '):].strip('\n'), "ascii", errors="ignore")
                if line.startswith('Author: '):
                    data['author'] = unicode(line[len('Author: '):].strip('\n'), "ascii", errors="ignore")
        return data
    def search_clusters(self, search, models=None, dist_away=2, orderby='importance', limit=20, exclusive=True):
        if not models:
            models = [m[1] for m in self.models.items()]
        near = dist_away
        clusters = {}
        similarclusters = []
        for model in models:
            clusters[model.name] = set([w[0] for w in model.sumNear(search, near, limit, orderby=orderby)])
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
    
    def most_similar_to(self, search, limit=10):
        models = self.models
        if isinstance(search, str): 
            search = [search]
        similars = {}
        for model in models:
            similars[model] = Counter()
            numwords = float(len(models[model].wordlist()))
            for word in search:
                if word in models[model].words:
                    similars[model].update({word: math.log(1+models[model].words[word].count/numwords)})
        sortedsums = sorted([(sum(similars[w].values()), w, similars[w].items()) for w in similars], reverse=True)[:limit]
        return sortedsums
    
    def common_clusters(self, models, dist_away=2, orderby='importance', limit=20, exclusive=True):
        models = [m[1] for m in models]
        n = len(models)
        wordsets = [set(m.words.keys()) for m in models]
        commonwords = set.intersection(*wordsets)
        commonclusters = {}
        for word in commonwords:
            found = kb.search_clusters(word, models, dist_away, orderby, limit, exclusive)
            if len(found) > 0:
                if word not in commonclusters:
                    commonclusters[word] = []
                commonclusters[word].extend(found)

        # If there is n choose 2 entries, then all of them have commonalities with each other
        commonclusters = {word: commonclusters[word] for word in commonclusters if len(commonclusters[word]) >= n * (n-1) / 2}
        return commonclusters
    
    def common_cluster_words(self, models, dist_away=2, orderby='importance', limit=20, exclusive=True, join='union'):
        commonclusters = self.common_clusters(models, dist_away,orderby,limit,exclusive)
        wordsets = {}
        for word in commonclusters:
            wordsets[word] = commonclusters[word][0][1]
            for l in commonclusters[word]:
                if join == 'union':
                    wordsets[word] = wordsets[word] | l[1]
                if join == 'intersection':
                    wordsets[word] = wordsets[word] & l[1]
        return wordsets


kb = KnowledgeBase(maxmodels=10, warriner=True)
# USE SESSIONS

def search(json):
    fields = json['fields']
    keywords = json['keyword']
    return [m[1] for m in kb.most_similar_to(keywords)][:10]

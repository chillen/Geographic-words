import zlib
import math
from collections import Counter

class TrackedWord:
    def __init__(self, word, parent):
        self.word = word
        self.nearby = {}
        self.count = 1
        self.weight = None
        self.parent = parent
    def __iadd__(self, other):
        self.count += other
        return self
    def addNearbyWord(self, word, N):
        """Add word to the nearby map as appearing N away."""
        if N not in self.nearby:
            self.nearby[N] = Counter()
        if word != '':
            self.nearby[N][word] += 1
    def getNearbyWords(self, N):
        """Return all words which appeared N away from self.
        
        Args:
            N: Integer representing far away a word must be to be considered nearby
            
        Returns:
            Dictionary of all words which appeared N away.
        """
        if N in self.nearby:
            return dict(self.nearby[N])
        else:
            return dict()
    def getNearbyWordsInRange(self, *args):
        """Return all words which which appear 1 to N words away from self.
        
        Args:
            args: Zero, One, or Two arguments representing the lower and upper
                    bounds of the range to be found. If only one argument is provided,
                    it will be an upper bound.
            
        Returns:
            A dictionary containing all found words and their number of occurrences.
        """
        lower = 1
        upper = 1
        if len(args) < 1:
            return dict()
        if len(args) == 1:
            upper = args[0]
        if len(args) == 2:
            lower = args[0]
            upper = args[1]
        cumulative = Counter()
        for i in range(lower, upper+1):
            cumulative += Counter(self.getNearbyWords(i))
        return dict(cumulative)
    def getWeight(self):
        """Return the TF-IDF value for a word.

        The TF-IDF is ther term frequency/inverse document frequency of a word.
        This represents the importance of the word relative to the work and the
        other works in the parent model.
        """
        if self.weight is None:
            df = float(self.parent.getNumberOfDocumentsContaining(self.word))
            n = float(self.parent.getNumberOfDocuments())
            self.weight = float(self.count) * math.log(n/df)
        return self.weight

    def getCount(self):
        return self.count

class TrackedWordModel:
    def __init__(self, text, parent, meta={}):
        self.text = zlib.compress(text)
        self.words = {}
        self.trackedDistances = set([0])
        self.meta = meta
        self.parent = parent

    def getText(self):
        return zlib.decompress(self.text)

    def setupTracking(self, N):
        """Update the word stracking model to track up to N words away if not already tracked.

        Args:
            N: Inclusive maximum distance for words to track.

        Returns:
            Self, for chaining.
        """
        words = self.getText().split()
        if N in self.trackedDistances:
            return self
        for i, word in enumerate(words):
            if word not in self.words:
                self.words[word] = TrackedWord(word, self)
            for j in range(N, 0, -1):
                if j in self.trackedDistances:
                    break
                wNback = words[i-j] if i-j >= 0 else ''
                wNfor = words[i+j] if i+j < len(words) else ''
                self.words[word].addNearbyWord(wNback, j)
                self.words[word].addNearbyWord(wNfor, j)
                self.words[word] += 1
        for i in range(N, 0, -1):
            if i not in self.trackedDistances:
                self.trackedDistances.add(i)
            else:
                break
        return self

    def getWordsNear(self, word, N):
        """Return a dictionary of words which are exactly N words away from word

        Args:
            word: The string being searched for.
            N: The distance away from word being searched.
        Return:
            Dictionary containing all nearby words, or an empty dictionary if word not found.
        """
        if N not in self.trackedDistances:
            self.setupTracking(N)
        if word in self.words:
            return dict(self.words[word].getNearbyWords(N))
        else:
            return dict()

    def getNearbyWordsInRange(self, word, *args):
        """Return all words which which appear 1 to N words away from self.

        Args:
            args: Zero, One, or Two arguments representing the lower and upper
                    bounds of the range to be found. If only one argument is provided,
                    it will be an upper bound.
            word: The word being searched for.

        Returns:
            A dictionary containing all found words and their number of occurrences.
        """
        lower = 1
        upper = 1
        if len(args) < 1:
            return dict()
        if len(args) == 1:
            upper = args[0]
        if len(args) == 2:
            lower = args[0]
            upper = args[1]

        if upper not in self.trackedDistances:
            self.setupTracking(upper)
        if word in self.words:
            nearby = self.words[word].getNearbyWordsInRange(lower, upper)
            return nearby
        else:
            return dict()

    def getMostFrequent(self):
        words = set()
        if len(self.words) == 0:
            self.setupTracking(1)
        for word in self.words:
            words.add((self.words[word].getCount(), word))
        words = sorted(words, reverse=True)
        return words

    def getMostImportant(self):
        words = set()
        if len(self.words) == 0:
            self.setupTracking(1)
        for word in self.words:
            words.add((self.words[word].getWeight(), word))
        words = sorted(words, reverse=True)
        return words

    def getNumberOfDocuments(self):
        return self.parent.getNumberOfDocuments()

    def getNumberOfDocumentsContaining(self, word):
        return self.parent.getNumberOfDocumentsContaining(word)

    def getWord(self, word):
        if len(self.words) == 0:
            self.setupTracking(1)
        if word in self.words:
            return self.words[word]
        else:
            return False

    def getWords(self):
        if len(self.words) == 0:
            self.setupTracking(1)
        return self.words

class WordModelCollection:

    def __init__(self):
        self.models = {}
        self.documentFrequencyCounter = Counter()
    def updateModel(self, text, meta):
        '''Add or update a model in the collection.

        If the title isn't in the collection, add it and update the DF count
        If the title is in the collection but the text is identical, do nothing
        If the title is in the collection but the text isn't identical, remove
        the set of words from the counter and add the set of the new text
        '''
        title = meta['title'].lower()
        if title in self.models:
            if self.models[title].getText() == text:
                return False
            else:
                self.documentFrequencyCounter -= set(self.models[title].getText().split())
        self.models[title] = TrackedWordModel(text, self, meta)
        self.updateDocumentFrequency(text)
        return True

    def getModel(self, title):
        return self.models[title.lower()]
    def getModels(self):
        return self.models
    def getNumberOfDocuments(self):
        return len(self.models)
    def getNumberOfDocumentsContaining(self, word):
        return self.documentFrequencyCounter[word]
    def updateDocumentFrequency(self, text=''):
        if text:
            self.documentFrequencyCounter.update(set(text.split()))
        self.documentFrequencyCounter = Counter()
        for model in self.models.values():
            self.documentFrequencyCounter.update(set(model.getText().split()))

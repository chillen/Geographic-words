import wordtrackingmodels as models
import wordlogic as logic

collection = models.WordModelCollection()
for model in logic.loadModels(maxmodels=10):
    collection.updateModel(model['text'], model['meta'])

def getDebugField(titles):
    """Return a field given a set of titles"""
    return logic.getFieldFromTitles(titles, collection)

def search(json, session):
    """Perform a search with the provided json."""
    reload(logic)
    return logic.search(json, collection, session)

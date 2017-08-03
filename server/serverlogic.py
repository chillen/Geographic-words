import wordtrackingmodels as models
import wordlogic as logic

collection = models.WordModelCollection()
for model in logic.loadModels(maxmodels=5):
  collection.updateModel(model['text'], model['meta'])

def search(json):
  reload(logic)
  return logic.search(json, collection)
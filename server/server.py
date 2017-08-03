from bottle import route, run, request, static_file, get
import json
import serverlogic

@route('/', method="POST")
def searchwords():
    data = request.json
    output = serverlogic.search(data)
    return json.dumps(output)

# Code to serve the frontend below

@get('/map')
def map():
    return static_file('index.html', '../map')

@get('/words')
def words():
    return static_file('index.html', '../words')

@get('/')
def homepage():
    return static_file('index.html', '../map')

@get("/map/<filepath:re:.*\.css>")
def mapcss(filepath):
    return static_file(filepath, root="../map")

@get("/words/<filepath:re:.*\.css>")
def wordscss(filepath):
    return static_file(filepath, root="../words")

@get("/data/<filepath:re:.*\.(jpg|png|gif|ico|svg)>")
def mapimg(filepath):
    return static_file(filepath, root="../map/data")

@get("/map/<filepath:re:.*\.js>")
def mapjs(filepath):
    return static_file(filepath, root="../map")

@get("/words/<filepath:re:.*\.js>")
def wordsjs(filepath):
    return static_file(filepath, root="../words")

run(host='localhost', port=8080)
from bottle import route, run, request, static_file, get, app, hook, post
from beaker.middleware import SessionMiddleware
import json
import serverlogic

session_opts = {
    'session.type': 'file',
    'session.data_dir': './session_data/',
    'session.auto': True
}

app = SessionMiddleware(app(), session_opts)
serverlogic.init()

@hook('before_request')
def setup_request():
    request.session = request.environ['beaker.session']

@post('/next')
def nextwords():
    data = request.json
    output = serverlogic.nextWords(data, request.session)
    response = output['response']
    session = output['session']
    request.session.update(session)
    request.session.save()
    return json.dumps(response)

@post('/search')
def searchwords():
    data = request.json
    output = serverlogic.search(data, request.session)
    response = output['response']
    session = output['session']
    request.session.update(session)
    request.session.save()
    return json.dumps(response)

# Code to serve the frontend below

@get('/map')
def map():
    return static_file('index.html', '../map')

@get('/words')
def words():
    request.session.save()
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

run(app=app)
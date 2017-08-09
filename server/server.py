from bottle import route, run, request, static_file, get, app
from beaker.middleware import SessionMiddleware
import json
import serverlogic

session_opts = {
    'session.type': 'file',
    'session.cookie_expires': 300,
    'session.data_dir': './session_data',
    'session.auto': True
}

@route('/', method="POST")
def searchwords():
    data = request.json
    session = request.environ.get('beaker.session')
    output = serverlogic.search(data, session)
    return json.dumps(output)

@route('/debugfield', method="GET")
def debugfield():
    data = request.json
    if title not in data:
        return json.dumps([])
    output = serverlogic.getDebugField(title)
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

app = SessionMiddleware(app(), session_opts)


run(app=app)
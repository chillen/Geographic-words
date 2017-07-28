from bottle import route, run, request, static_file, get
import json
import wordlogic
# import wordlogic

# Sample code
# fetch("/",
# {
#     headers: {
#       'Accept': 'application/json',
#       'Content-Type': 'application/json'
#     },
#     method: "POST",
#     body: JSON.stringify({fields: [{tag: 'dracula', intensity: 0.69}], keyword: 'blood'})
# })
# .then(res => res.json())
# .then(console.log)

@route('/', method="POST")
def searchwords():
    data = request.json
    print wordlogic.search(data)
    return json.dumps(wordlogic.search(data))

# Code to serve the frontend below

@get('/')
def homepage():
    return static_file('index.html', '../client/')

@get("<filepath:re:.*\.css>")
def css(filepath):
    return static_file(filepath, root="../client")

@get("/data/<filepath:re:.*\.(jpg|png|gif|ico|svg)>")
def img(filepath):
    return static_file(filepath, root="../client/data")

@get("<filepath:re:.*\.js>")
def js(filepath):
    return static_file(filepath, root="../client")

run(host='localhost', port=8080)
# Geographic Word Association

Here's my experimental work to try and get some lateral thinking 
grounded in a geographic space. 

## Operation

Two servers need to be running: One to serve the frontend and one
to serve the backend. They're separated since they're built to 
operate in completely different ways and should operate mostly
independently. 

### Server

For the server, run `py pyserv.py` and it should get running on port 8000.
There's no browser component. This server can now handle GET requests.

It returns JSON objects.

### Client

Anything that serves HTTP is fine. I recommend `python -m SimpleHTTPServer`.
It only needs the server to display images correctly, since cross origin 
resource sharing (CORS) is super strict in browsers.
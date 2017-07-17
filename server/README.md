# Server

This project makes use of various learning libraries which 
don't run particularly well within a browser. Additionally, a lot
of the experimental work is being done in IPython notebooks so
it just made sense to make the backend in python.

The server is setup to take in requests from anywhere. If this doesn't
suit your needs, adjust the `origin` variable to your specific front-end
server, i.e. `origin = "http://localhost:999"` or 
`origin = "https://chillen.github.io/geographics-words"`. I'm not sure if
they work. 

## About the Server

The actual server is just hacked together from StackOverflow. I didn't want
to do anything complicated or secure. For now, this is simply a means to
receive get requests, perform some Python code, and then output. It's not
even tested right now. A reminder that if you do use this, there is 
*zero guarantee for safety, security, or peace of mind.* This is barebones
research code. Use at your own risk.

## About the Business Logic

This will be updated over time, hopefully.
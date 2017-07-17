# -*- coding: UTF-8 -*-

import SimpleHTTPServer
import SocketServer
import time
import thread
import urlparse
import json

origin = "*"

class MyHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/kill_server'):
            print "Server is going down, run it again manually!"
            def kill_me_please(server):
                server.shutdown()
            thread.start_new_thread(kill_me_please, (httpd,))
            self.send_error(500)
        query = dict(urlparse.parse_qsl(urlparse.urlsplit(self.path).query))
        print query
        print json.dumps(query)
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.send_header("Access-control-allow-origin", origin)
        self.end_headers()
        self.wfile.write(json.dumps(query))
        

class MyTCPServer(SocketServer.TCPServer):
    def server_bind(self):
        import socket
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.socket.bind(self.server_address)

server_address = ('', 8000)
httpd = MyTCPServer(server_address, MyHandler)
try:
    httpd.serve_forever()
except KeyboardInterrupt:
    pass
httpd.server_close()
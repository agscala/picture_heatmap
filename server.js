var http = require('http');
var url = require('url');

var redis = require('redis'),
    client = redis.createClient();

var Dispatcher = function() {
    var self = this;
    var GET_routes = {};
    var POST_routes = {};

    this.GET = function(url, callback) {
        console.log("Route: GET " + url);
        GET_routes[url] = callback;
    };

    this.POST = function(url, callback) {
        console.log("Route: POST " + url);
        POST_routes[url] = callback;
    };

    this.route = function(request, response) {
        var parsed_request = url.parse(request.url, true);
        console.log(request.method + ": " + parsed_request.pathname);

        var http404 = function(req, res) {
            console.log("404! " + request.method + ": " + parsed_request.pathname);

            res.writeHead(404, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
            res.write("404 Not Found\n");  
            res.end(); 
        };

        if(request.method == "GET") {
            var method = GET_routes[parsed_request.pathname] || http404;
            method(parsed_request, response);
        }

        else if(request.method == "POST") {
            var method = GET_routes[parsed_request.pathname] || http404;
            method(parsed_request, response);
        }
    };
};

var dispatcher = new Dispatcher();

dispatcher.GET('/test', function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
});

dispatcher.GET('/click', function(req, res) {
    console.log("X: ", req.query.x)
    console.log("Y: ", req.query.y)
    data = {
        'x' : req.query.x,
        'y' : req.query.y,
    };

    client.rpush('points', JSON.stringify(data), redis.print);

    res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});

    res.write(JSON.stringify({'a': 1}));
    res.end();
});

dispatcher.GET('/clicks', function(req, res) {
    console.log("X: ", req.query.x)
    console.log("Y: ", req.query.y)
    data = {
        'x' : req.query.x,
        'y' : req.query.y,
    };

    var points = [];
    client.lrange('points', "0", "-1", function(err, replies) {
        replies.forEach(function(reply, i) {
            points.push(JSON.parse(reply));
            console.log(reply);
        });

        res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});

        res.write(JSON.stringify(points || []));
        res.end();
    });
});

http.createServer(function (req, res) {
    dispatcher.route(req, res);
}).listen(8124, "127.0.0.1");

console.log('Server running at http://127.0.0.1:8124/');


var http = require('http');
var url = require('url');
var request = require('request');

var redis = require('redis'),
    client = redis.createClient();

function is_image_url(url, callbacks) {
	request({uri: url}, function(error, response, body) {
		var content_type = response.headers['content-type'];
		var is_image = (content_type.indexOf("image") != -1);

		if(is_image ) {
			if(callbacks !== undefined && callbacks['success'] !== undefined)
				callbacks.success();
		}
		else {
			if(callbacks !== undefined && callbacks['failure'] !== undefined)
				callbacks.failure();
		}
	});
}

is_image_url("http://www.google.com/images/nav_logo40.png");

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

dispatcher.GET('/new', function(req, res) {
	image_url = req.query.url;

	is_image_url(image_url, {
		success: function() {
			console.log("SAVING: " + image_url);
			client.sadd("images", image_url);

			res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
			res.write(JSON.stringify({"success": true}));
			res.end();
		},
		failure: function() {
			console.log("NOT SAVING: " + image_url);

			res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
			res.write(JSON.stringify({"success": false}));
			res.end();
		}
	});
});

dispatcher.GET('/random', function(req, res) {
	client.srandmember('images', function(err, image_url) {
    res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
		res.write(JSON.stringify({"success": 1, "url": image_url}));
		res.end();
	});
});

dispatcher.GET('/click', function(req, res) {

	image = req.query.image;
    point = {
        'x' : req.query.x,
        'y' : req.query.y,
    };

    console.log(image + " clicked at (" + req.query.x + ", " + req.query.y + ")")

    client.rpush(image + '.points', JSON.stringify(point), redis.print);

    res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
    res.write(JSON.stringify({"success": 1}));
    res.end();
});

dispatcher.GET('/clicks', function(req, res) {
	var image = req.query.image;
	console.log("Getting click data for " + image);

    client.lrange(image + ".points", "0", "-1", function(err, replies) {
		var points = [];
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


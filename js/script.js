/*
Copyright (c) 2010, Patrick Wied. All rights reserved.
Code licensed under the BSD License:
http://patrick-wied.at/static/license.txt
*/
var Heatmap = function(canvas_id, width, height) {
	var self = this;

	// var definition
	// canvas: the canvas element
	// context: the canvas 2d context
	// width: the heatmap width for border calculations
	// height: the heatmap height for border calculations
	// invoke: the app doesn't react on the mouse events unless the invoke var is set to true
	this.canvas = document.getElementById(canvas_id);
	this.canvas.width = width;
	this.canvas.height = height;
	this.context = this.canvas.getContext("2d");
	this.width = width;
	this.height = height;

	this.radius1 = 20;
	this.radius2 = 40;

	// function for coloring the heatmap
	this.colorize = function(x, y, x2) {
		// initial check if x and y is outside the app
		// -> resetting values
		if(x+x2 > width)
			x = width-x2;
		if(x < 0)
			x = 0;
		if(y < 0)
			y = 0;
		if(y+x2 > height)
			y = height-x2;
		// get the image data for the mouse movement area
		var image = this.context.getImageData(x, y, x2, x2);
		// some performance tweaks
		var imageData = image.data;
		var length = imageData.length;

		// loop thru the area
		for(var i = 3; i < length; i += 4) {

			var r = 0,
				g = 0,
				b = 0,
				tmp = 0,
				// [0] -> r, [1] -> g, [2] -> b, [3] -> alpha
				alpha = imageData[i];

			// coloring depending on the current alpha value
			if(alpha<=255 && alpha >= 235){
				tmp=255-alpha;
				r=255-tmp;
				g=tmp*12;
			} else if(alpha<=234 && alpha >= 200){
				tmp=234-alpha;
				r=255-(tmp*8);
				g=255;
			} else if(alpha<= 199 && alpha >= 150){
				tmp=199-alpha;
				g=255;
				b=tmp*5;
			} else if(alpha<= 149 && alpha >= 100){
				tmp=149-alpha;
				g=255-(tmp*5);
				b=255;
			} else
				b=255;

			imageData[i-3] = r;
			imageData[i-2] = g;
			imageData[i-1] = b;
		}
		// the rgb data manipulation didn't affect the ImageData object(defined on the top)
		// after the manipulation process we have to set the manipulated data to the ImageData object
		image.data = imageData;
		this.context.putImageData(image,x,y);
	}

	this.add_point = function(x, y) {
		if(typeof(x)=='undefined') {
			console.log("THERE WAS A PROBLEM");
			return;
		}

		// storing the variables because they will be often used
		var r1 = this.radius1;
		var r2 = this.radius2;

		//console.log("x: "+x+"; y:" +y);
		// create a radial gradient with the defined parameters. we want to draw an alphamap
		var rgr = self.context.createRadialGradient(x, y, r1, x, y, r2);
		// the center of the radial gradient has .1 alpha value
		rgr.addColorStop(0, 'rgba(0,0,0,0.1)');
		// and it fades out to 0
		rgr.addColorStop(1, 'rgba(0,0,0,0)');
		// drawing the gradient
		this.context.fillStyle = rgr;
		this.context.fillRect(x-r2, y-r2, 2*r2, 2*r2);
		// at last colorize the area
		this.colorize(x-r2, y-r2, 2*r2);
	};

	this.getData = function(){
		return this.canvas.toDataURL();
	}
};

function set_instructions(text) {
    $("#instructions").html(text);
}

var counter = 0
function next_num() {
	counter = counter + 1;
	return counter;
}


var Image = function(url) {
    var self = this;
	this.url = url;

	var div_string = "image-" + next_num();
	var heatmap_div_string = "heatmap-" + next_num();

	$("#pictures").append(""+
		"<div id='" + div_string +"' class='image-wrapper'>" +
			"<div class='image absolute'><img src='" + url + "'/></div>" +
			"<canvas id='" + heatmap_div_string + "' class='image-heatmap absolute'></canvas>" +
		"</div>" +
		"<div class='clear'></div>"
	);

    this.div = $("#" + div_string);
    this.state = IMAGE;

	this.width = this.div.find("img").attr('width');
	this.height = this.div.find("img").attr('height');

	this.div.css('width', this.width);
	this.div.css('height', this.height);

	this.heatmap = new Heatmap(heatmap_div_string, this.width, this.height);

    this.div.find(".image").click(function(event) {
        var x = event.offsetX;
        var y = event.offsetY;

		self.heatmap.add_point(x, y);
		self.generate_heatmap();

        $.ajax({
            url: "http://127.0.0.1:8124/click",
            dataType: 'json',
            data: {'x': x, 'y': y, image: self.url},
            success: function(json) {
                self.show_heatmap();
				self.state = HEATMAP;

            },
        });


        set_instructions("CLICK THE PICTURE AGAIN");
    });

    this.generate_heatmap = function() {
        $.getJSON("http://127.0.0.1:8124/clicks", {image: self.url}, function(points) {
			for(var i in points) {
				var x = points[i].x
				var y = points[i].y
				self.heatmap.add_point(x, y);
			}
        });
    };

    this.show_heatmap = function() {
        this.div.find(".image-heatmap").fadeIn();
    };


	this.disappear = function(callback) {
		self.div.find(".image-heatmap").fadeOut(200, function() {
			self.div.fadeOut(200, function() {
				if(callback) {
					callback();
				}
			});
		});
	};

	this.reveal = function(callback) {
		self.div.fadeIn(200);
        set_instructions("CLICK THE PICTURE");

		if(callback) {
			callback();
		}
	};
}

var IMAGE = 0,
    HEATMAP = 1;

var ImageManager = (function() {
	var self = this;
	var current_image, next_image;

	var get_next_image = function() {
		$.getJSON("http://127.0.0.1:8124/random", function(data) {
			var url = data['url'];

			next_image = new Image(url);
			next_image.disappear();
		});
	};

	var initialize = function() {
		$.getJSON("http://127.0.0.1:8124/random", function(data) {
			var url = data['url'];

			current_image = new Image(url);
			current_image.reveal();
			get_next_image();
		});
	}

    $("body").click(function(event) {
        if(current_image.state == HEATMAP) {
			current_image.disappear(function() {
				current_image = next_image;
				current_image.reveal();
				get_next_image();
			});
        }
    });

	return {
		initialize: initialize,
	};
})();

$(document).ready(function() {
	ImageManager.initialize();

	$("#new-image-submit").click(function(event) {
		event.preventDefault();
		var url = $("#new-image-url").val();

		$.getJSON("http://127.0.0.1:8124/new", {"url": url}, function(data) {
			if(data['success']) {
				alert("Thanks, Looks good");
				var url = $("#new-image-url").clear();
			}
			else {
				alert("Sorry, we can't processes that url");
			}
		});
	});
});
























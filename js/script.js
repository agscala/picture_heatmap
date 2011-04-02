/*
Copyright (c) 2010, Patrick Wied. All rights reserved.
Code licensed under the BSD License:
http://patrick-wied.at/static/license.txt
*/
var heatmapApp = (function(){
	var self = this;
	// var definition
	// canvas: the canvas element
	// ctx: the canvas 2d context
	// width: the heatmap width for border calculations
	// height: the heatmap height for border calculations
	// invoke: the app doesn't react on the mouse events unless the invoke var is set to true
	var canvas,
		ctx,
		width,
		height,
		radius1 = 20,
		radius2 = 40,
		invoke = false;
	// function for coloring the heatmap
	var colorize = function(x,y,x2){
		// initial check if x and y is outside the app
		// -> resetting values
		if(x+x2>width)
			x=width-x2;
		if(x<0)
			x=0;
		if(y<0)
			y=0;
		if(y+x2>height)
			y=height-x2;
		// get the image data for the mouse movement area
		var image = ctx.getImageData(x,y,x2,x2),
		// some performance tweaks
			imageData = image.data,
			length = imageData.length;
		// loop thru the area
		for(var i=3; i < length; i+=4){

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
			}else if(alpha<=234 && alpha >= 200){
				tmp=234-alpha;
				r=255-(tmp*8);
				g=255;
			}else if(alpha<= 199 && alpha >= 150){
				tmp=199-alpha;
				g=255;
				b=tmp*5;
			}else if(alpha<= 149 && alpha >= 100){
				tmp=149-alpha;
				g=255-(tmp*5);
				b=255;
			}else
				b=255;
			// we ve started with i=3
			// set the new r, g and b values
			imageData[i-3]=r;
			imageData[i-2]=g;
			imageData[i-1]=b;
		}
		// the rgb data manipulation didn't affect the ImageData object(defined on the top)
		// after the manipulation process we have to set the manipulated data to the ImageData object
		image.data = imageData;
		ctx.putImageData(image,x,y);
	}

	this.add_point = function(x, y) {
		if(typeof(x)=='undefined') {
			console.log("THERE WAS A PROBLEM");
			return;
		}

		// storing the variables because they will be often used
		var r1 = radius1;
		var r2 = radius2;

		//console.log("x: "+x+"; y:" +y);
		// create a radial gradient with the defined parameters. we want to draw an alphamap
		var rgr = ctx.createRadialGradient(x,y,r1,x,y,r2);
		// the center of the radial gradient has .1 alpha value
		rgr.addColorStop(0, 'rgba(0,0,0,0.1)');
		// and it fades out to 0
		rgr.addColorStop(1, 'rgba(0,0,0,0)');
		// drawing the gradient
		ctx.fillStyle = rgr;
		ctx.fillRect(x-r2,y-r2,2*r2,2*r2);
		// negate the invoke variable
		// next execution of the logic is when the activate method activates the invoke var again
		invoke=!invoke;
		// at least colorize the area
		colorize(x-r2,y-r2,2*r2);
	};

	return {
		initialize: function(c, wt, ht){
			canvas = document.getElementById(c);
			canvas.width = wt;
			canvas.height = ht;
			ctx = canvas.getContext("2d");
			width = wt;
			height = ht;
		},

		add_point: function(x, y) {
			self.add_point(x, y);
		},

		getData: function(){
			return canvas.toDataURL();
		}
	};
})();

function set_instructions(text) {
    $("#instructions").html(text);
}

var IMAGE = 0,
    HEATMAP = 1;

var Image = function(div) {
    var self = this;

    this.div = $(div);
    this.position = $(div).offset();
    this.state = IMAGE;
	this.heatmap = heatmapApp.initialize("heatmap", 400, 300);

    $(".image").click(function(event) {
        var x = event.offsetX;
        var y = event.offsetY;
		heatmapApp.add_point(x, y);

		self.generate_heatmap();

        $.ajax({
            url: "http://127.0.0.1:8124/click",
            dataType: 'json',
            data: {'x': x, 'y': y},
            success: function(json) {
                self.show_heatmap();
            },
        });

        set_instructions("Click anywhere to continue");
    });

    this.generate_heatmap = function() {
        $.getJSON("http://127.0.0.1:8124/clicks", function(points) {
			for(var i in points) {
				var x = points[i].x
				var y = points[i].y
				heatmapApp.add_point(x, y);
			}
        });
    };

    this.show_heatmap = function() {
        $(".image-heatmap").fadeIn();
    };

    var next_image = function() {
        /* $.getJSON("", function(data) {
            self.generate_heatmap();
        }); */
    };

    $("body").click(function(event) {
        if(self.state == HEATMAP) {

        }
    });
}

$(document).ready(function() {
    var image = new Image(".image");
});
























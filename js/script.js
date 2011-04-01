function set_instructions(text) {
    $("#instructions").html(text);
}

var IMAGE = 0,
    HEATMAP = 1;

var Image = function(div) {
    var self = this;

    this.div = $(div);
    this.position = this.div.position();
    this.state = IMAGE;

    $(".image").click(function(event) {
        var x = event.pageX - self.position.left;
        var y = event.pageY - self.position.top;

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
        // $.getJSON("POINT_DATA");
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
























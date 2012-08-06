var vows = require('vows');
var assert = require("assert");

var Cropping = require("../lib/cropping");

vows.describe("AOI cropping calculations").addBatch({
    "when the area of interest fits inside the cropped format": {
        topic: function() {
            var cropping = new Cropping.AoiCropping(1000, 500, 100, 100, [10,10,200,150]);
            return cropping.getCropRect();
        },
        "the aspect ratio stays the same": function(topic) {
            var r1 = topic[2]/topic[3];
            var r2 = 100/100;
            var diff = Math.abs(r2-r1);
            assert.ok(diff < 0.0000000001);
        }
    },
    "when the area does not fit inside the cropped format with the width being too large": {
        topic: function() {
            var cropping = new Cropping.AoiCropping(1000, 500, 1000, 100, [10,10,200,250]);
            return cropping.getCropRect();
        },
        "the cropping heigth is equal to the AOIs height": function(topic) {
            assert.equal(topic[3], 250);
        },
        "the cropping width is smaller than it's supposed to be according to the height": function(topic){
            assert.ok(topic[2] < 2500);
        }
    },
    "the border around the cropped image to make it fit the requested ratio with a too large width": {
        topic: function() {
            var cropping = new Cropping.AoiCropping(1000, 500, 1000, 100, [10,10,200,250]);
            return cropping.getCropRect();
        },
        "needs to fill the width ": function(topic) {
            assert.equal(topic[3], 250);
        }
    }

}).export(module);

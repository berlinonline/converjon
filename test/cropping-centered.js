var vows = require('vows');
var assert = require("assert");

var Cropping = require("../lib/cropping");

vows.describe("Centered cropping calculations").addBatch({
    "when the aspect ratio is  smaller than the original": {
        topic: function() {
            var cropping = new Cropping.CenteredCropping(1000, 500, 100, 100);
            return cropping.getCropRect();
        },
        "the cropping heigth is 100%": function(topic) {
            assert.equal(topic[2], 500);
        },
        "the cropping width must be smaller than the original": function(topic) {
            assert.equal(topic[3], 500);
        },
        "the X offset must be half the cropped width left of the originals center": function(topic) {
            assert.equal(topic[0], 250);
        },
        "ths Y offset must be zero": function(topic) {
            assert.equal(topic[1], 0);
        }
    },
    "when the aspect ratio is bigger than the original": {
        topic: function() {
            var cropping = new Cropping.CenteredCropping(1000, 500, 400, 100);
            return cropping.getCropRect();
        },
        "the cropping heigth is smaller than the original": function(topic) {
            assert.equal(topic[3], 250);
        },
        "the cropping width must be 100% of the original": function(topic) {
            assert.equal(topic[2], 1000);
        },
        "the X offset must be zero": function(topic) {
            assert.equal(topic[0], 0);
        },
        "ths Y offset must be half the cropped height above the originals center": function(topic) {
            assert.equal(topic[1], 125);
        }
    }

}).export(module);

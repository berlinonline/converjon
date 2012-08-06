var vows = require('vows');
var assert = require("assert");

var Cropping = require("../lib/cropping");

vows.describe("General cropping calculations").addBatch({
    "when the aspect ration does not fit": {
        topic: function() {
            var cropping = new Cropping.CenteredCropping(1000, 500, 100, 100);
            return cropping.isNeeded();
        },
        "cropping is required": function(topic) {
            assert.equal(topic, true);
        }
    },
    "but when it fits": {
        topic: function() {
            var cropping = new Cropping.CenteredCropping(1000, 500, 300, 150);
            return cropping.isNeeded();
        },
        "no cropping is needed": function(topic) {
            assert.equal(topic, false);
        }
    }

}).export(module);

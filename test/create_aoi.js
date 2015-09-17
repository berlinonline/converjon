/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var pathutils = require("../lib/pathutils");
var config = require("../lib/config");
config.load([
    pathutils.join([__dirname, "resources", "test_config.yml"])
]);
var aoi = require("../lib/processing").create_aoi;

module.exports = {
    testInteger: function(test) {
        test.expect(4);

        var result = aoi(1000, 500, "50,50,900,400");

        test.strictEqual(result.x, 50);
        test.strictEqual(result.y, 50);
        test.strictEqual(result.w, 900);
        test.strictEqual(result.h, 400);

        test.done();
    },

    testIntegerPercent: function(test) {
        test.expect(4);

        var result = aoi(1000, 500, "5%,20%,50%,60%");

        test.strictEqual(result.x, 50);
        test.strictEqual(result.y, 100);
        test.strictEqual(result.w, 500);
        test.strictEqual(result.h, 300);

        test.done();
    },

    testFloatPercent: function(test) {
        test.expect(4);

        var result = aoi(1000, 500, "5.7%,20.3%,50%,60%");

        test.strictEqual(result.x, 57);
        test.strictEqual(result.y, 102);
        test.strictEqual(result.w, 500);
        test.strictEqual(result.h, 300);

        test.done();
    },

    testWrongFormat: function(test) {
        test.expect(2);

        try {
            var result = aoi(1000, 500, "5.7%,20.3%,50%");
        } catch (e) {
            test.strictEqual(e.name, "AoiFormatError");
        }

        try {
            var result = aoi(1000, 500, "10,0,x,500");
        } catch (e) {
            test.strictEqual(e.name, "AoiFormatError");
        }

        test.done();
    },
};


/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var crop = require("../lib/cropping").crop_centered;

module.exports = {
    testPortrait: function(test) {
        test.expect(4);

        var test_object = {
            source: {
                w: 1000,
                h: 500
            },
            target: {
                w: 100,
                h: 100
            }
        };

        var result = crop(test_object);

        test.strictEqual(result.x, 250);
        test.strictEqual(result.y, 0);
        test.strictEqual(result.w, 500);
        test.strictEqual(result.h, 500);

        test.done();
    },

    testLandscape: function(test) {
        test.expect(4);

        var test_object = {
            source: {
                w: 1000,
                h: 500
            },
            target: {
                w: 400,
                h: 100
            }
        };

        var result = crop(test_object);

        test.strictEqual(result.x, 0);
        test.strictEqual(result.y, 125);
        test.strictEqual(result.w, 1000);
        test.strictEqual(result.h, 250);

        test.done();
    }
};


/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var crop = require("../lib/cropping");

module.exports = {
    testFitting: function(test) {
        test.expect(4);

        var test_object = {
            source: {
                w: 1000,
                h: 500
            },
            mode: crop.none,
            target: {
                w: 100,
                h: 50
            }
        };

        var result = crop(test_object);

        test.strictEqual(result.x, 0);
        test.strictEqual(result.y, 0);
        test.strictEqual(result.w, 1000);
        test.strictEqual(result.h, 500);

        test.done();
    },

    testNonFitting: function(test) {
        test.expect(4);

        var test_object = {
            source: {
                w: 1000,
                h: 500
            },
            mode: crop.none,
            target: {
                w: 400,
                h: 100
            }
        };

        var result = crop(test_object);

        test.strictEqual(result.x, 0);
        test.strictEqual(result.y, 0);
        test.strictEqual(result.w, 1000);
        test.strictEqual(result.h, 500);

        test.done();
    }
};

/* jshint globalstrict: true */

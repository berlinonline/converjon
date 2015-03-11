/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var crop = require("../lib/cropping");

module.exports = {
    testLandscapeAoi: function(test) {
        test.expect(6);

        var test_object = {
            source: {
                w: 1000,
                h: 500,
                aoi: {
                    x: 10,
                    y: 10,
                    w: 200,
                    h: 150
                }
            },
            mode: crop.aoi_emphasis,
            target: {
                w: 100,
                h: 100
            }
        };

        var result = crop(test_object);

        test.strictEqual(result.x, 10);
        test.strictEqual(result.y, 0);
        test.strictEqual(result.w, 200);
        test.strictEqual(result.h, 200);
        test.strictEqual(result.padding.x, 0);
        test.strictEqual(result.padding.y, 0);

        test.done();
    },

    testPortraitAoi: function(test) {
        test.expect(6);

        var test_object = {
            source: {
                w: 1000,
                h: 500,
                aoi: {
                    x: 10,
                    y: 10,
                    w: 150,
                    h: 200
                }
            },
            mode: crop.aoi_emphasis,
            target: {
                w: 100,
                h: 100
            }
        };

        var result = crop(test_object);

        test.strictEqual(result.x, 0);
        test.strictEqual(result.y, 10);
        test.strictEqual(result.w, 200);
        test.strictEqual(result.h, 200);
        test.strictEqual(result.padding.x, 0);
        test.strictEqual(result.padding.y, 0);

        test.done();
    },

    testPadding: function(test) {
        test.expect(6);

        var test_object = {
            source: {
                w: 500,
                h: 500,
                aoi: {
                    x: 10,
                    y: 10,
                    w: 100,
                    h: 100
                }
            },
            mode: crop.aoi_emphasis,
            target: {
                w: 1000,
                h: 100
            }
        };

        var result = crop(test_object);

        test.strictEqual(result.x, 0);
        test.strictEqual(result.y, 10);
        test.strictEqual(result.w, 500);
        test.strictEqual(result.h, 100);
        test.strictEqual(result.padding.x, 250);
        test.strictEqual(result.padding.y, 0);

        test.done();
    }
};


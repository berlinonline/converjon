/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var crop = require("../lib/cropping");

module.exports = {
    testFittingInside: function(test) {
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
            mode: crop.aoi_coverage,
            target: {
                w: 100,
                h: 100
            }
        };

        var result = crop(test_object);

        test.strictEqual(result.x, 0);
        test.strictEqual(result.y, 0);
        test.strictEqual(result.w, 500);
        test.strictEqual(result.h, 500);
        test.strictEqual(result.padding.x, 0);
        test.strictEqual(result.padding.y, 0);

        test.done();
    },

    testCropTooWide: function(test) {
        test.expect(6);

        var test_object = {
            source: {
                w: 1000,
                h: 500,
                aoi: {
                    x: 10,
                    y: 10,
                    w: 200,
                    h: 250
                }
            },
            mode: crop.aoi_coverage,
            target: {
                w: 1000,
                h: 100
            }
        };

        var result = crop(test_object);

        test.strictEqual(result.x, 0);
        test.strictEqual(result.y, 10);
        test.strictEqual(result.w, 1000);
        test.strictEqual(result.h, 250);
        test.strictEqual(result.padding.x, 750);
        test.strictEqual(result.padding.y, 0);

        test.done();
    },

    testCropTooTall: function(test) {
        test.expect(6);

        var test_object = {
            source: {
                w: 1000,
                h: 500,
                aoi: {
                    x: 10,
                    y: 10,
                    w: 200,
                    h: 250
                }
            },
            mode: crop.aoi_coverage,
            target: {
                w: 100,
                h: 1000
            }
        };

        var result = crop(test_object);

        test.strictEqual(result.x, 10);
        test.strictEqual(result.y, 0);
        test.strictEqual(result.w, 200);
        test.strictEqual(result.h, 500);
        test.strictEqual(result.padding.x, 0);
        test.strictEqual(result.padding.y, 750);

        test.done();
    }
};


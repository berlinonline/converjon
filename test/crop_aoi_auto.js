/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var crop = require("../lib/cropping");

module.exports = {
    testFitting: function(test) {
        test.expect(6);

        var test_object = {
            source: {
                w: 1000,
                h: 1000,
                aoi: {
                    x: 100,
                    y: 100,
                    w: 100,
                    h: 100
                }
            },
            mode: crop.aoi_auto,
            target: {
                w: 100,
                h: 200
            }
        };

        var result = crop(test_object);

        test.strictEqual(result.x, 0);
        test.strictEqual(result.y, 0);
        test.strictEqual(result.w, 300);
        test.strictEqual(result.h, 600);
        test.strictEqual(result.padding.x, 0);
        test.strictEqual(result.padding.y, 0);

        test.done();
    },

    testPadding: function(test) {
        test.expect(6);

        var test_object = {
            source: {
                w: 1000,
                h: 800,
                aoi: {
                    x: 100,
                    y: 100,
                    w: 100,
                    h: 100
                }
            },
            mode: crop.aoi_auto,
            target: {
                w: 100,
                h: 1000
            }
        };

        var result = crop(test_object);

        test.strictEqual(result.x, 100);
        test.strictEqual(result.y, 0);
        test.strictEqual(result.w, 100);
        test.strictEqual(result.h, 800);
        test.strictEqual(result.padding.x, 0);
        test.strictEqual(result.padding.y, 100);

        test.done();
    }
};


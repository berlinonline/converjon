/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var check_aoi = require("../lib/processing").check_aoi;

module.exports = {

    testValidAoi: function (test) {
        test.expect(1);
        var w = 1000;
        var h = 500;

        var aoi = {
            x: 10,
            y: 100,
            w: 800,
            h: 250
        };

        try {
            check_aoi(w, h, aoi);
            test.strictEqual(1, 1);
        } catch (e) {
            // should not happen in this test
        }
        test.done();
    },

    testInvalidAoi: function (test) {
        test.expect(1);
        var w = 1000;
        var h = 500;

        var aoi = {
            x: 200,
            y: 100,
            w: 900,
            h: 250
        };

        try {
            check_aoi(w, h, aoi);
        } catch (e) {
            test.strictEqual(e.name, "AoiError");
        }
        test.done();
    },

    testZeroAoi: function (test) {
        test.expect(1);
        var w = 1000;
        var h = 500;

        var aoi = {
            x: 0,
            y: 0,
            w: 0,
            h: 0
        };

        try {
            check_aoi(w, h, aoi);
        } catch (e) {
            test.strictEqual(e.name, "AoiError");
        }
        test.done();
    }
};


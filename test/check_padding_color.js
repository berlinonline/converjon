/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var check_padding_color = require("../lib/processing").check_padding_color;

module.exports = {

    testValidColorFormat: function (test) {
        test.expect(1);
        var testitem = {
            options: {
                padding_color: '#ff0000'
            }
        };
        try {
            check_padding_color(testitem);
            test.strictEqual(1, 1);
        } catch (e) {
            // should not happen in this test
        }
        test.done();
    },

    testInvalidColorFormat: function (test) {
        test.expect(1);
        var testitem = {
            options: {
                padding_color: 'nf0000'
            }
        };
        try {
            check_padding_color(testitem);
        } catch (e) {
            test.strictEqual(e.name, "ColorFormatError");
        }
        test.done();
    }
};


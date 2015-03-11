/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var util = require("../lib/util");

module.exports = {
    testsortObject: function(test) {
        test.expect(1);

        var test_object = {
            foo: 1,
            bar: 2,
            abc: 3
        };

        var expected = {
            abc: 3,
            bar: 2,
            foo: 1
        };

        var sorted_object = util.sortProperties(test_object);

        var i;

        test.strictEqual(
            JSON.stringify(sorted_object),
            JSON.stringify(expected)
        );

        test.done();
    }
};


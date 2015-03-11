/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var match = require("../lib/match");

module.exports = {

    testCalmcardPattern: function (test) {
        test.expect(1);
        var pattern = "foo*";
        var str = "foobar";

        test.strictEqual(match(pattern, str), true);

        test.done();
    },

    testRegexPattern: function (test) {
        test.expect(2);
        var pattern = "~ foo[a-z]*$";
        var str1 = "foobar";
        var str2 = "fooBar";

        test.strictEqual(match(pattern, str1), true);
        test.strictEqual(match(pattern, str2), false);

        test.done();
    },
};


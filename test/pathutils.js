/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var pathutils = require("../lib/pathutils");
var path_sep = require("path").sep;

module.exports = {
    testHashPath: function(test) {
        test.expect(1);

        var url = "http://example.org";

        var expected = [
            "aHR0cDov",
            "L2V4YW1w",
            "bGUub3Jn"
        ].join(path_sep);

        test.strictEqual(pathutils.getHashPath(url), expected);
        test.done();
    },

    testObjectPath: function(test) {
        test.expect(2);

        var options1 = {
            width: 100,
            height: 50,
            mime: "gif"
        };

        var options2 = {
            height: 50,
            width: 100,
            mime: "gif"
        };

        var expected = [
            "height_50",
            "mime_gif",
            "width_100"
        ].join(path_sep);

        test.strictEqual(pathutils.getOptionsPath(options1), expected);
        test.strictEqual(pathutils.getOptionsPath(options2), expected);

        test.done();
    }
};

/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var paths = require("../lib/paths");
var path_sep = require("path").sep;

module.exports = {
    testHashPath: function(test) {
        test.expect(1);

        var url = "http://example.org";

        var expected = [
            "971a565c",
            "8ac770ff",
            "0b288d98",
            "a507bb83",
            "2b800221",
            "4411ed82",
            "44d0b981",
            "a506dd3e"
        ].join(path_sep);

        test.strictEqual(paths.getHashPath(url), expected);
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

        test.strictEqual(paths.getOptionsPath(options1), expected);
        test.strictEqual(paths.getOptionsPath(options2), expected);

        test.done();
    }
};

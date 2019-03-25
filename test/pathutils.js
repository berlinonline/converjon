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
        var expected = "97/971a565c8ac770ff0b288d98a507bb832b8002214411ed8244d0b981a506dd3e";

        test.strictEqual(pathutils.getHashPath(url), expected.replace('/', path_sep));
        test.done();
    },

    testHashPathForLongUrls: function(test) {
        test.expect(1);

        var url = "https://some-example-long-s3-bucketname.aws.example.org/with-uuids/as-identifiers/a5d3b8ec-63a0-4e13-a0d1-d9f9e7389ccd/for/some/a5d3b8ec-63a0-4e13-a0d1-d9f9e7389ccd/a5d3b8ec-63a0-4e13-a0d1-d9f9e7389ccdsa5d3b8ec-63a0-4e13-a0d1-d9f9e7389ccda5d3b8ec-63a0-4e13-a0d1-d9f9e7389ccd/script/to/deliver/assets?and=with&parameters[]=that&are=probably,not,needed,but,who,cares,about,necessities&these=days#fragmentid-nobody-wants";

        var expected = "56/561def15fd34e2194f9ce5d30e042f7a6c21711b5eb03a5c7a5541df5e80400d";

        test.strictEqual(pathutils.getHashPath(url), expected.replace('/', path_sep));
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

        var expected = "613228dbb215e6ddf79748674b0ec3b5d10e2f0f578de5dcbbe118f7eaf4481a";

        test.strictEqual(pathutils.getOptionsPath(options1), expected);
        test.strictEqual(pathutils.getOptionsPath(options2), expected);

        test.done();
    },

    testObjectPathWithManyOptions: function(test) {
        test.expect(2);

        var options1 = {
            width: 100,
            height: 50,
            mime: "gif",
            a: "a",
            b: "b",
            c: "c",
            d: "d",
            e: "e",
            f: "f",
            g: "g",
            h: "h"
        };

        var options2 = {
            height: 50,
            a: "a",
            b: "b",
            c: "c",
            d: "d",
            width: 100,
            e: "e",
            f: "f",
            g: "g",
            mime: "gif",
            h: "h"
        };

        var expected = "912aa6f0cf4ceea401add58d41bf274f2803d400fe96a64d98522b47393aae11";

        test.strictEqual(pathutils.getOptionsPath(options1), expected);
        test.strictEqual(pathutils.getOptionsPath(options2), expected);

        test.done();
    },

    testObjectPathWithoutOptions: function(test) {
        test.expect(1);
        test.strictEqual(pathutils.getOptionsPath({}), "__no_options");
        test.done();
    }
};

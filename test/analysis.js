/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
"use strict";
var rsvp = require("rsvp");
var Promise = rsvp.Promise;

var pathutils = require("../lib/pathutils");
var config = require("../lib/config");
config.load([
    pathutils.join([__dirname, "resources", "test_config.yml"])
]);
var analyze = require("../lib/analyze");
var lock = require("../lib/lock").lock;

module.exports = {

    testAnalysisSuccess: function(test) {
        test.expect(7);

        var conf = config.get();
        lock(pathutils.join([
            __dirname,
            "resources",
            "images",
            "test_image_sparrow.jpg"
        ])).then(function(l) {
            analyze(l, conf).then(function(analysis){
                test.strictEqual(analysis.width, 4126);
                test.strictEqual(analysis.height, 2551);
                test.strictEqual(analysis.aoi.x, 760);
                test.strictEqual(analysis.aoi.y, 365);
                test.strictEqual(analysis.aoi.w, 1100);
                test.strictEqual(analysis.aoi.h, 850);
                test.strictEqual(analysis.format, "jpeg");
                l();
                test.done();
            });
        });
    },

    testAnalysisFailure: function(test) {
        test.expect(0);

        var conf = config.get();
        lock("foobar").then(function(l){
            analyze(l, conf).catch(function(error) {
                l();
                test.done();
            });
        });
    }
};

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
var lock = require("../lib/lock");

var file_lock;
var file_lock_broken;

module.exports = {

    setUp: function(cb) {

        lock(pathutils.join([
            __dirname,
            "resources",
            "images",
            "test_image_sparrow.jpg"
        ])).then(function(l) {
            file_lock = l;

            lock("foobar").then(function(l){
                file_lock_broken = l;
                cb();
            });
        });
    },

    testAnalysisSuccess: function(test) {
        test.expect(2);

        var conf = config.get();
        analyze(file_lock, conf).then(function(analysis){
            test.strictEqual(analysis.width, "4126");
            test.strictEqual(analysis.height, "2551");
            file_lock();
            test.done();
        });
    }
};

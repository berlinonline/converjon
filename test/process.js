/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
"use strict";
var rsvp = require("rsvp");
var Promise = rsvp.Promise;

var pathutils = require("../lib/pathutils");
var config = require("../lib/config");
var process = require("../lib/process");

module.exports = {

    setUp: function(cb) {
        config.load([
            pathutils.join([__dirname, "resources", "test_config.yml"])
        ]);

        cb();
    },

    testProcessSuccess: function(test) {
        test.expect(1);

        process("echo", ["foo", "bar"]).then(function(output){
            test.strictEqual(output, "foo bar\n");
            test.done();
        });
    },

    testProcessFailure: function(test) {
        test.expect(1);

        process("false").catch(function(output){
            test.strictEqual(output, "");
            test.done();
        });
    }
};

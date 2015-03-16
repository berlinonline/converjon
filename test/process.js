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
var process = require("../lib/process");

module.exports = {
    testProcessSuccess: function(test) {
        test.expect(1);
        process("echo", ["foo", "bar"]).then(function(result){
            test.strictEqual(result.stdout, "foo bar\n");
            test.done();
        });
    },

    testProcessFailure: function(test) {
        test.expect(1);

        process("false").catch(function(result){
            test.strictEqual(result.stderr, "");
            test.done();
        });
    }
};

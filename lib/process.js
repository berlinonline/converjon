/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var spawn = require("child_process").spawn;

var Promise = require("rsvp").Promise;
var config = require("./config").get("");
var get_slot = require("./slots")(config.process.limit);

function process(command, args) {
    //  get_slot returns an RSVP.Promise
    return get_slot().then(function(free) {
        return new Promise(function(resolve, reject) {
            var stdout = "";
            var stderr = "";

            var child = spawn(command, args);

            //accumulate STDOUT
            child.stdout.on("data", function(data) {
                stdout += data;
            });

            //accumulate STDERR
            child.stderr.on("data", function(data) {
                stderr += data;
            });

            child.on("close", function(exit_code) {
                if (exit_code === 0) {
                    resolve(stdout);
                } else {
                    reject(stderr);
                }

                //don't forget to free up the slot again
                free();
            });
        });
    });
}


/*
 * Returns a promise representing a single shild process.
 * The promise will resolve into the STDOUT data from that process or
 * be rejected into the STDERR data.
 *
 * resolve/reject is determined by the exit code of the child process
 * = 0 => resolve
 * > 0 => reject
 */
module.exports = function(command, args) {
    return process(command, args);
};

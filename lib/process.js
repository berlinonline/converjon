/* jshint globalstrict: true */
/* global require */
/* global module */
/* global setTimeout */
/* global clearTimeout */
"use strict";

var spawn = require("child_process").spawn;

var Promise = require("rsvp").Promise;
var config = require("./config").get();
var get_slot = require("./slots")(config.process.limit);

function process_result(exit_code, stdout, stderr, error) {
    return {
        exit_code: exit_code,
        stdout: stdout,
        stderr: stderr,
        error: error
    };
}

function process(command, args) {
    //  get_slot returns an RSVP.Promise
    return get_slot().then(function(free) {
        return new Promise(function(resolve, reject) {
            var stdout = "";
            var stderr = "";
            var timeout = setTimeout(function() {
                stderr = "Process timeout: " + command + " " + args.join(" ");
                child.kill();
            }, config.process.timeout);

            var child = spawn(command, args);

            //accumulate STDOUT
            child.stdout.on("data", function(data) {
                stdout += data;
            });

            //accumulate STDERR
            child.stderr.on("data", function(data) {
                stderr += data;
            });

            child.on("error", function(err) {
                if (err.code === "ENOENT") {
                    err.message = "Could not spawn process with command '"+command+"'";
                }

                //don't forget to free up the slot again
                free();

                reject(process_result(null, stdout, stderr, err.message));
            });

            child.on("close", function(exit_code) {
                clearTimeout(timeout);

                //don't forget to free up the slot again
                free();

                if (exit_code === 0) {
                    resolve(process_result(exit_code, stdout, stderr, null));
                } else {
                    reject(process_result(exit_code, stdout, stderr, null));
                }
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

/* jshint globalstrict: true */
/* global require */
/* global module */
/* global process */
"use strict";

var parse = require('minimist');

//
function is_array(x) {
    return Object.prototype.toString.call(x) === "[object Array]";
}

function get_args(options) {
    var args = {};
    var argv = parse(process.argv.slice(2), options || {});

    var i;

    for (i in argv) {
        if (argv.hasOwnProperty(i)) {
            if (i !== "_" && i != "config" && is_array(argv[i])) {
                argv[i] = argv[i].pop();
            }
        }
    }

    return argv;
}

module.exports = get_args;

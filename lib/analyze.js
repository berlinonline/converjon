/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
"use strict";

var rsvp = require("rsvp");
var Promise = rsvp.Promise;

var process = require("./process");

var active_list = {};
var exiftoolConfigPath = __dirname + "/../config/exiftool";

function analyze(file_lock, config) {
    return process(
        'exiftool',
        ['-config', exiftoolConfigPath, file_lock.key]
    ).then(function(data) {
        return new Promise(function(resolve, reject) {
            var analysis = {};

            var lines = data.trim().replace(/[\n\r]+/, "\n").split("\n");
            lines.forEach(function(line){
                var dim;
                var index = line.indexOf(':');
                var key = line.substring(0, index).trim();
                var value = line.substring(index + 1).trim();
                if (key === "Image Size") {
                    index = value.indexOf('=');
                    key = value.substring(0, index);
                    value = value.substring(index + 1);
                    dim = value.split('x');

                    analysis.width = dim[0];
                    analysis.height = dim[1];
                } else if (key === config.analysis.aoi_name){
                    analysis.aoi = value;
                } else if (key === "Error") {
                    analysis.error = value;
                }
            });

            resolve(analysis);
        });
    });
}

module.exports = function(file_lock, config) {
    var file_path = file_lock.key;
    /*
     * if there's already an unresolved promise for this url, return that one
     * instead of starting a second download of source files
     */
    if (!(file_path in active_list)) {
        active_list[file_path] = analyze(file_lock, config);
    }

    return active_list[file_path];
};

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
    var file_path = file_lock.key;

    function removeFromActiveList () {
        if (file_path in active_list) {
            delete active_list[file_path];
        }
    }

    var promise = process(
        'exiftool',
        ['-config', exiftoolConfigPath, file_path]
    ).then(function(data) {
        return new Promise(function(resolve, reject) {
            var analysis = {};

            var lines = data.trim().replace(/[\n\r]+/, "\n").split("\n");
            lines.forEach(function(line){
                var dim;
                var index = line.indexOf(':');
                var key = line.substring(0, index).trim();
                var value = line.substring(index + 1).trim();
                var aoi_rect;

                if (key === "Image Size") {
                    index = value.indexOf('=');
                    key = value.substring(0, index);
                    value = value.substring(index + 1);
                    dim = value.split('x');

                    analysis.width = +(dim[0]);
                    analysis.height = +(dim[1]);
                } else if (key === "File Type") {
                    analysis.format = value.toLowerCase();
                } else if (key === config.analysis.aoi_name){
                    aoi_rect = value.split(',');
                    analysis.aoi = {
                        x: +(aoi_rect[0]),
                        y: +(aoi_rect[1]),
                        w: +(aoi_rect[2]),
                        h: +(aoi_rect[3])
                    };
                } else if (key === "Error") {
                    analysis.error = value;
                }
            });

            resolve(analysis);
        });
    });

    // regardless of how the promise finishes,
    // remove this url from the active downloads list
    promise.then(removeFromActiveList, removeFromActiveList);

    return promise;
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

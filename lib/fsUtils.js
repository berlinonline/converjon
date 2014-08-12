/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var path = require("path");

var Promise = require("rsvp").Promise;
var __mkdirp = require("mkdirp");
var fs = require("fs");

var mkdirp = function(dir_path) {
    return new Promise(function(resolve, reject) {
        __mkdirp(dir_path, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(dir_path);
            }
        });
    });
};

/**
 * returns a promise that resolves into the path lock if it exists.
 * otherwise it rejects with the path as argument.
 */
function file_exists(path_lock) {
    return new Promise(function(resolve, reject) {
        fs.exists(path_lock.key, function(exists) {
            if (exists) {
                resolve(path_lock);
            } else {
                reject(path_lock);
            }
        });
    });
}

module.exports = {
    mkdirp: mkdirp,
    file_exists: file_exists,
    mkdirForFile: function(file_path) {
        return mkdirp(path.dirname(file_path));
    }
};

/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var path = require("path");

var Promise = require("rsvp").Promise;
var __mkdirp = require("mkdirp");

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

module.exports = {
    mkdirp: mkdirp,
    mkdirForFile: function(file_path) {
        return mkdirp(path.dirname(file_path));
    }
};

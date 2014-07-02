/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var Promise = require("rsvp").Promise;
var __mkdirp = require("mkdirp");

var mkdirp = function(path) {
    return new Promise(function(resolve, reject) {
        __mkdirp(path, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(path);
            }
        });
    });
};

module.exports = {
    mkdirp: mkdirp
};

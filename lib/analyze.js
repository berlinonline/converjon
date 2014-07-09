/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var rsvp = require("rsvp");
var Promise = rsvp.Promise;

module.exports = function(file_path) {
    return new Promise(function(resolve, reject){
        resolve({
              analysis: "TODO"
        });
    });
};

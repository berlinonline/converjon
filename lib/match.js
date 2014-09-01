/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var calmcard = require("calmcard");

module.exports = function(pattern, key) {
    if (pattern.substr(0,2) === "~ ") {
        pattern = new RegExp(pattern.substr(2));
        return pattern.test(key);
    } else {
        return calmcard(pattern, key);
    }
};

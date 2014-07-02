/* jshint globalstrict: true */
/* global require */
/* global exports */
"use strict";

var createHash = require("crypto").createHash;
var path_sep = require("path").sep;

var util = require("./util");

function sha256(data) {
    return createHash('sha256').update(data).digest('hex');
}


exports.getHashPath = function(input) {
    var hash = sha256(input);
    var i;

    var path_parts = [];

    for (i = 0; i < 8; i++) {
        path_parts.push(hash.substr(8*i, 8));
    }

    return path_parts.join(path_sep);
};

exports.getOptionsPath = function(options) {
    var i, type;

    var path_parts = [];

    for (i in util.sortProperties(options)) {
        type = typeof options[i];
        if (type === "string" || type === "number") {
            path_parts.push(i + "_" + options[i]);
        }
    }

    return path_parts.join(path_sep);
};

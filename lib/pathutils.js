/* jshint globalstrict: true */
/* global require */
/* global exports */
/* global Buffer */
"use strict";

var path_sep = require("path").sep;

var util = require("./util");
var crypto = require("crypto");

function join(parts) {
    return parts.join(path_sep);
}

function replaceAll(string, omit, place, prevstring) {
    if (prevstring && string === prevstring) {
        return string;
    }
    prevstring = string.replace(omit, place);
    return replaceAll(prevstring, omit, place, string);
}

exports.join = join;

exports.getHashPath = function(input) {
    var hash = crypto.createHash('sha256').update(Buffer.from(input)).digest("hex");
    return hash.substr(0, 2)+path_sep+hash;
};

exports.getOptionsPath = function(options) {
    var path_parts = [];
    var sortedProperties = util.sortProperties(options);

    path_parts = Object.keys(sortedProperties).filter(function(i) {
        var type = typeof options[i];
        return (type === "string" || type === "number");
    }).map(function(i) {
        return i + "_" + options[i];
    });

    if (path_parts.length === 0) {
        return "__no_options";
    }

    return crypto.createHash('sha256').update(Buffer.from(join(path_parts))).digest("hex");
};

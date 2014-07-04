/* jshint globalstrict: true */
/* global require */
/* global exports */
/* global Buffer */
"use strict";

var path_sep = require("path").sep;

var util = require("./util");

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
    var hash = replaceAll((new Buffer(input)).toString('base64'), "=", "");
    var part;

    var path_parts = [];

    /*
     * split the has string into chunks of max length 8
     */
    do {
        part = hash.substr(0,8);
        if (part !== "") {
            path_parts.push(part);
        }
        hash = hash.substr(8);
    } while (part !== "");

    return join(path_parts);
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

    return join(path_parts);
};

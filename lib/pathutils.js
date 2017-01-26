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
    var path_parts = [];

    var sortedProperties = util.sortProperties(options);

    path_parts = Object.keys(sortedProperties).filter(function(i) {
        var type = typeof options[i];
        return (type === "string" || type === "number");
    }).map(function(i) {
        return i + "_" + options[i];
    })

    if (path_parts.length === 0) {
        path_parts.push("__no_options");
    }

    return join(path_parts);
};

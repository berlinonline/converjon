/* jshint globalstrict: true */
/* global require */
/* global exports */
"use strict";

/**
 * Sort the keys of an object
 *
 * @param {object} the object to be sorted
 * @returns {object} the sorted version
 */
exports.sortProperties = function (obj) {
    var i;
    var keys = [];
    var sorted = {};
    for (i in obj) {
        if (obj.hasOwnProperty(i)) {
            keys.push(i);
        }
    }

    keys.sort();

    for (i = 0; i < keys.length; i++) {
        sorted[keys[i]] = obj[keys[i]];
    }

    return sorted;
};


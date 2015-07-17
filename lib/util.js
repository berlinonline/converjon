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

/**
 * Checks, if a HTTP response is still fresh according to it's headers
 * and the current date/time
 *
 * @param {object} the http headers of the response
 */
exports.headers_still_fresh = function(headers) {
    headers = headers || {};
    var expires = headers.Expires || headers.expires;
    var expires_date;
    var cache_control = headers["Cache-Control"] || headers["cache-control"];
    var date = headers.Date || headers.date;
    var now = new Date();
    var max_age, max_age_end;

    if (expires) {
        expires = new Date(Date.parse(expires));
        if (now > expires) {
            return false;
        } else {
            return true;
        }
    }

    if (cache_control) {
        cache_control.split(",").forEach(function(item) {
            var tuple = item.split("=");
            if (tuple.length === 2) {
                if (tuple[0].trim() === "max-age") {
                    max_age = +(tuple[1].trim());
                }
            }
        });
    }

    if (typeof max_age !== "undefined" && date) {
        max_age_end = new Date(Date.parse(date));
        max_age_end.setSeconds(max_age_end.getSeconds() + max_age);
        if (now > max_age_end) {
            return false;
        } else {
            return true;
        }
    }

    return false;
};

/**
 * applies an array of functions to a value, using the return value
 * of one function as the argument for the next.
 * returns the result of the last function.
 */
exports.apply_functions = function(value, functions) {
    return functions.reduce(function(previous, current) {
        return current(previous);
    }, value);
};

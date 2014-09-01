/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var clone = require("clone");

function merge(a, b) {

    if (Object.prototype.toString.call( b ) !== '[object Object]') {
        //b is not a mergable value, just overwrite a with it!
        return clone(b);
    }

    if (Object.prototype.toString.call( a ) !== '[object Object]') {
        //if a is not an object but b is one, set a to an empty one
        //to allow merging
        a = {};
    }

    var i;
    for (i in b) {
        if (b.hasOwnProperty(i)) {
            if (a.hasOwnProperty(i)) {
                a[i] = merge(a[i], b[i]);
            } else {
                a[i] = clone(b[i]);
            }
        }
    }

    return a;
}

module.exports = function() {
    var items = Array.prototype.slice.call(arguments);

    var result = {};
    var i;
    var l = items.length;

    for (i = 0 ; i < l; i++) {
        result = merge(result, items[i]);
    }

    return result;
};


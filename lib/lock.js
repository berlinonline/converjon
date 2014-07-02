/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var Promise = require("rsvp").Promise;

var locks = {};

var waiting = {};

/**
 * release a lock on a resource
 */
function free(key) {
    if (locks[key]) {
        delete locks[key];
        tick(key);
    }
}

/**
 * cycle the waiting list for one resource
 */
function tick(key) {
    var next;
    if (waiting[key]) {
        //there's somone waiting for this resource
        if (!locks[key]) {
            locks[key] = true;
            next = waiting[key].shift();
            if (waiting[key].length === 0) {
                //nobody is waiting for this resource anymore, clean it up
                delete waiting[key];
            }
            next(key);
        }
    }
}

/**
 * register a handler for a resource
 * the handler will be called when nobody before it is waiting
 * for that resoruce
 */
function wait(key, cb) {
    if (!waiting[key]) {
        waiting[key] = [];
    }

    waiting[key].push(cb);
}

/**
 * Returns a promise for a resource lock that resolves into
 * a function to release that lock again.
 *
 * Usage:
 * var l1 = lock("foo");
 * l1.then(function(free) {
 *  // do your work
 *  free(); /release the lock
 * });
 *
 * @param {string} identifier for a resource to be locked
 * @returns {Promise} A Promise that resolves when the lock is obtained
 */
module.exports = function(key) {

    var promise = new Promise(function(resolve, reject) {

        wait(key, function(key) {
            var released = false;
            resolve(function(){
                if (!released) {
                    free(key);
                    released = true;
                }
            });
        });
    });

    tick(key);

    return promise;
};

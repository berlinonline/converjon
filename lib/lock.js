/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var Promise = require("rsvp").Promise;
var stats = require("./stats");

var locks = {};

var waiting = {};

/**
 * release a lock on a resource
 */
function free(key) {
    if (locks[key]) {
        delete locks[key];
        stats.lock_remove();
    }
    tick(key);
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
            stats.lock_add();
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
 * l1.then(function(l) {
 *  // do your work
 *  // l.key contains the key of the locked_item
 *  l(); /release the lock
 * });
 *
 * @param {string} identifier for a resource to be locked
 * @returns {Promise} A Promise that resolves when the lock is obtained
 */
function lock(key) {
    var promise = new Promise(function(resolve, reject) {

        wait(key, function(key) {
            var released = false;
            var lock = function() {
                if (!released) {
                    free(key);
                    released = true;
                }
            };
            lock.key = key;

            resolve(lock);
        });
    });

    tick(key);

    return promise;
}

/**
 * a resource is "free", if it's not locked and nobody is waiting to get a lock on it.
 *
 * @param {string} identifier for a resource to be locked
 * @returns {boolean} 
 */
function is_free(key) {
    return (typeof waiting[key] === "undefined" && typeof locks[key] === "undefined");
}

module.exports = {
    is_free: is_free,
    lock: lock
};

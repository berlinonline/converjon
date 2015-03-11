/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var Promise = require("rsvp").Promise;

/**
 * Returns a function that returns Promises
 * which represent one worker slot from a limited pool of slots.
 *
 * The Promise resolves into a function that MUST be called after
 * using the slot to free it up again.
 *
 * Usage:
 *   var slots = require("./slots)(10); //make a pool of 10 slots
 *
 *   var s1 = slots(); //request a new slot
 *
 *   s1.then(function(free) {
 *      //do your work here
 *
 *      free(); //call "free" to return the slot into the pool
 *   });
 *
 * @param {number} An integer, defining the number of available slots
 * @returns {function} A function that requests one new slot
 */
module.exports = function(limit) {
    limit = +limit || 10;

    var waiting = [];

    var available = limit;

    function free() {
        if (available < limit) {
            available = available + 1;
        }

        tick();
    }

    function tick() {
        if (waiting.length > 0) {
            if (available > 0) {
                available = available - 1;

                waiting.shift()();
            }
        } else {
            // no slots available
        }
    }

    return function() {
        return new Promise(function(resolve, reject) {
            waiting.push(function(){
                /*
                 * ensure that this promise's `free`is only called once
                 */
                var released = false;
                resolve(function() {
                    if (!released) {
                        released = true;
                        free();
                    }
                });
            });

            tick();
        });
    };
};

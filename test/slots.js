/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var slots = require("../lib/slots");

module.exports = {

    testEmptyPool: function (test) {
        test.expect(1);
        var pool = slots(2);

        var s1 = pool();

        s1.then(function(free) {
            test.strictEqual(typeof free, "function");
            test.done();
        });
    },

    testFullPool: function (test) {
        test.expect(1);
        var pool = slots(2);

        var s1 = pool();
        var s2 = pool();
        var s3 = pool();

        s1.then(function(free) {
            test.strictEqual(typeof free, "function");
            test.done();
        });

        s3.then(function(free) {
            test.strictEqual(typeof free, "function");
            test.done();
        });
    },

    testFullPoolWithRelease: function (test) {
        test.expect(2);
        var pool = slots(2);

        var s1 = pool();
        var s2 = pool();
        var s3 = pool();

        s1.then(function(free) {
            test.strictEqual(typeof free, "function");
            free();
        });

        s3.then(function(free) {
            test.strictEqual(typeof free, "function");
            test.done();
        });
    }
};

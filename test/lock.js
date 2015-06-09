/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var lock = require("../lib/lock").lock;

module.exports = {

    testLockRelease: function (test) {
        test.expect(2);

        var releases = [];

        var l1 = lock("foo");
        var l2 = lock("foo");
        var l3 = lock("foo");

        l3.then(function(free) {
            releases.push("l3");

            // ensure the correct order of lock releases
            test.strictEqual(releases.join(":"), "l1:l2:l3");
            test.strictEqual(free.key, "foo");
            test.done();
        });

        l1.then(function(free) {
            releases.push("l1");
            free();
        });

        l2.then(function(free) {
            releases.push("l2");
            free();
        });
    },

    testKeepLock: function(test) {
        test.expect(0);

        var l1 = lock("bar");
        var l2 = lock("bar");

        l2.then(function(free) {
            test.equal(true, false);
        });

        l1.then(function(free){
            //"forget" to call free() so the item stays locked
        });

        test.done();
    }
};

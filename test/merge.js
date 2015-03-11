/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var merge = require("../lib/merge");

module.exports = {

    testDeepMerge: function (test) {
        test.expect(3);

        var o1 = {
            a: 1,
            b: {
                c: 2
            }
        };

        var o2 = {
            b: {
                d: 3
            }
        };

        var m = merge(o1, o2);

        test.strictEqual(m.a, 1);
        test.strictEqual(m.b.c, 2);
        test.strictEqual(m.b.d, 3);

        test.done();
    }

};


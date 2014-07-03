/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var config = require("../lib/config");

module.exports = {

    setUp: function(cb) {
        config.load([]);
        cb();
    },

    testDefaultConfig: function (test) {
        test.expect(2);

        var cfg = config.get();

        test.strictEqual(cfg.server.port, 80);
        test.strictEqual(cfg.urls[0], "http://localhost*");

        test.done();
    }

};


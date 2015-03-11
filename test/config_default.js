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
        test.expect(1);

        var cfg = config.get();

        test.strictEqual(cfg.server.port, 8000);

        test.done();
    }

};


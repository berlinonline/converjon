/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
"use strict";

var config = require("../lib/config");
var pathutils = require("../lib/pathutils");

module.exports = {

    setUp: function(cb) {
        config.load([
            pathutils.join([__dirname, "resources", "test_config.yml"]),
            pathutils.join([__dirname, "resources", "test_config.json"])
        ]);
        cb();
    },

    /*
    testMergedJsonConfig: function (test) {
        test.expect(3);

        var cfg = config.get("http://example.org/foobar" );

        test.strictEqual(cfg.server.port, 9000);
        test.strictEqual(cfg.urls[0], "http://example.org*");
        test.strictEqual(cfg.cache.base_path, "./cache");

        test.done();
    }
    */
};



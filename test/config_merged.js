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
            pathutils.join([__dirname, "resources", "merge_test_config.yml"]),
            pathutils.join([__dirname, "resources", "merge_test_config.json"])
        ]);
        cb();
    },

    testMergedConfig: function (test) {
        test.expect(5);

        var cfg = config.get("http://localhost:8001/foobar" );

        test.strictEqual(cfg.server.port, 8000);
        test.strictEqual(cfg.urls[0], "http://localhost:8001*");
        test.strictEqual(cfg.cache.base_path, "cache");
        test.strictEqual(cfg.foo.bar, 7);

        var cfg2 = config.get("http://example.org/something");
        test.strictEqual(cfg2.foo.bar, 5);

        test.done();
    }

};



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
            pathutils.join([__dirname, "resources", "merge_test_config.yml"])
        ]);
        cb();
    },

    testMergedYamlConfig: function (test) {
        test.expect(3);

        var cfg = config.get("http://localhost:8001/foobar" );

        test.strictEqual(cfg.server.port, 8000);
        test.strictEqual(cfg.urls[0], "http://localhost:8001*");
        test.strictEqual(cfg.cache.base_path, "cache");

        test.done();
    }

};



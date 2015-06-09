/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
"use strict";
var fs = require("fs");
var http = require("http");
var send = require("send");
var url = require("url");
var rsvp = require("rsvp");
var Promise = rsvp.Promise;

var pathutils = require("../lib/pathutils");
var fsutils = require("../lib/fsutils");
var lock = require("../lib/lock").lock;
var config = require("../lib/config");
config.load([
    pathutils.join([__dirname, "resources", "test_config.yml"])
]);

var get_source = require("../lib/source");
var start_test_server = require("./utils/test_server");
var static_image_server;

module.exports = {

    setUp: function(cb) {

        static_image_server = start_test_server(10000);
        cb();
    },

    testSingleDownload: function(test) {
        test.expect(2);

        var item1 = {
            source_type: "url",
            source: "http://localhost:10000/test_image_sparrow.jpg",
        };
        item1.conf = config.get(item1.source);

        var dir_path = item1.conf.cache.base_path;

        fsutils.mkdirp(dir_path).then(function() {
            return rsvp.hash({
                meta: lock(pathutils.join([dir_path, "meta"])),
                source: lock(pathutils.join([dir_path, "source"]))
            });
        }).then(function(locks){
            item1.locks = locks;
            return get_source(item1);
        }).then(function(result) {
            result.locks.meta();
            result.locks.source();
            return new Promise(function(resolve, reject){
                var path = pathutils.join([dir_path, "source"]);
                fs.open(path, "r", function(err, file) {
                    test.strictEqual(err, null);
                    resolve(dir_path);
                });
            });
        }).then(function(dir_path){
            return new Promise(function(resolve, reject){
                var path = pathutils.join([dir_path, "meta"]);
                fs.open(path, "r", function(err, file) {
                    test.strictEqual(err, null);
                    resolve(dir_path);
                });
            });
        }).then(function(){
            test.done();
        });
    },

    testAuthenticatedDownload: function(test) {
        test.expect(2);

        var item1 = {
            source_type: "url",
            source: "http://localhost:10000/authenticated_url"
        };
        item1.conf = config.get(item1.source);

        var dir_path = item1.conf.cache.base_path;

        fsutils.mkdirp(dir_path).then(function() {
            return rsvp.hash({
                meta: lock(pathutils.join([dir_path, "meta"])),
                source: lock(pathutils.join([dir_path, "source"]))
            });
        }).then(function(locks){
            item1.locks = locks;
            return get_source(item1);
        }).then(function(result) {
            result.locks.meta();
            result.locks.source();
            return new Promise(function(resolve, reject){
                var path = pathutils.join([dir_path, "source"]);
                fs.open(path, "r", function(err, file) {
                    test.strictEqual(err, null);
                    resolve(dir_path);
                });
            });
        }).then(function(dir_path){
            return new Promise(function(resolve, reject){
                var path = pathutils.join([dir_path, "meta"]);
                fs.open(path, "r", function(err, file) {
                    test.strictEqual(err, null);
                    resolve(dir_path);
                });
            });
        }).then(function(){
            test.done();
        });
    },


    testParallelDownloads: function(test) {
        test.expect(4);

        var item1 = {
            source_type: "url",
            source: "http://localhost:10000/test_image_sparrow.jpg"
        };
        item1.conf = config.get(item1.source);

        var dir_path = item1.conf.cache.base_path;

        var d1 = fsutils.mkdirp(dir_path).then(function() {
            return rsvp.hash({
                meta: lock(pathutils.join([dir_path, "meta1"])),
                source: lock(pathutils.join([dir_path, "source1"]))
            });
        }).then(function(locks){
            item1.locks = locks;
            return get_source(item1);
        }).then(function(result) {
            result.locks.meta();
            result.locks.source();
            return new Promise(function(resolve, reject){
                var path = pathutils.join([dir_path, "source1"]);
                fs.open(path, "r", function(err, file) {
                    test.strictEqual(err, null);
                    resolve(dir_path);
                });
            });
        }).then(function(dir_path){
            return new Promise(function(resolve, reject){
                var path = pathutils.join([dir_path, "meta1"]);
                fs.open(path, "r", function(err, file) {
                    test.strictEqual(err, null);
                    resolve(dir_path);
                });
            });
        });

        var item2 = {
            source_type: "url",
            source: "http://localhost:10000/test_image_sparrow_2.jpg"
        };
        item2.conf = config.get(item2.source);

        var d2 = fsutils.mkdirp(dir_path).then(function() {
            return rsvp.hash({
                meta: lock(pathutils.join([dir_path, "meta2"])),
                source: lock(pathutils.join([dir_path, "source2"]))
            });
        }).then(function(locks){
            item2.locks = locks;
            return get_source(item2);
        }).then(function(result) {
            result.locks.meta();
            result.locks.source();
            return new Promise(function(resolve, reject){
                var path = pathutils.join([dir_path, "source2"]);
                fs.open(path, "r", function(err, file) {
                    test.strictEqual(err, null);
                    resolve(dir_path);
                });
            });
        }).then(function(dir_path){
            return new Promise(function(resolve, reject){
                var path = pathutils.join([dir_path, "meta2"]);
                fs.open(path, "r", function(err, file) {
                    test.strictEqual(err, null);
                    resolve(dir_path);
                });
            });
        });

        rsvp.all([d1, d2]).then(function(){
            test.done();
        });
    },

    test404: function(test) {
        test.expect(1);

        var item1 = {
            source_type: "url",
            source: "http://localhost:10000/non_existing.jpg"
        };
        item1.conf = config.get(item1.source);
        var dir_path = item1.conf.cache.base_path;
        var locks;

        rsvp.hash({
            meta: lock("404_meta"),
            source: lock("404_source"),
        }).then(function(locks) {
            item1.locks = locks;
            return get_source(item1);
        }).then(
            function() {
                test.equal("this should not happen", "ever!");
            },
            function(fail) {
                test.strictEqual(fail.name, "SourceHttpError");
                test.done();
            }
        );
    },

    testZeroLength: function(test) {
        test.expect(1);

        var item1 = {
            source_type: "url",
            source: "http://localhost:10000/zero_length.jpg"
        };
        item1.conf = config.get(item1.source);
        var dir_path = item1.conf.cache.base_path;
        var locks;

        fsutils.mkdirp(dir_path).then(function() {
            return rsvp.hash({
                meta: lock(pathutils.join([dir_path, "zero_meta"])),
                source: lock(pathutils.join([dir_path, "zero_source"]))
            });
        }).then(function(locks){
            item1.locks = locks;
            return get_source(item1);
        }).then(
            function() {
                test.equal("this should not happen", "ever!");
            },
            function(fail) {
                test.strictEqual(fail.name, "FileSystemError");
                test.done();
            }
        );
    },

    tearDown: function(cb) {
        static_image_server.close(function(){
            cb();
        });
    }

};

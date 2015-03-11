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
var lock = require("../lib/lock");
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

        var url1 = "http://localhost:10000/test_image_sparrow.jpg";
        var conf1 = config.get(url1);

        var dir_path = conf1.cache.base_path;

        fsutils.mkdirp(dir_path).then(function() {
            return rsvp.hash({
                meta: lock(pathutils.join([dir_path, "meta"])),
                source: lock(pathutils.join([dir_path, "source"]))
            });
        }).then(function(locks){
            return get_source(url1, locks, conf1);
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

        var url1 = "http://localhost:10000/authenticated_url";
        var conf1 = config.get(url1);

        var dir_path = conf1.cache.base_path;

        fsutils.mkdirp(dir_path).then(function() {
            return rsvp.hash({
                meta: lock(pathutils.join([dir_path, "meta"])),
                source: lock(pathutils.join([dir_path, "source"]))
            });
        }).then(function(locks){
            return get_source(url1, locks, conf1);
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

        var url1 = "http://localhost:10000/test_image_sparrow.jpg";
        var conf1 = config.get(url1);

        var dir_path = conf1.cache.base_path;

        var d1 = fsutils.mkdirp(dir_path).then(function() {
            return rsvp.hash({
                meta: lock(pathutils.join([dir_path, "meta1"])),
                source: lock(pathutils.join([dir_path, "source1"]))
            });
        }).then(function(locks){
            return get_source(url1, locks, conf1);
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

        var url2 = "http://localhost:10000/test_image_sparrow_2.jpg";
        var conf2 = config.get(url1);

        var d2 = fsutils.mkdirp(dir_path).then(function() {
            return rsvp.hash({
                meta: lock(pathutils.join([dir_path, "meta2"])),
                source: lock(pathutils.join([dir_path, "source2"]))
            });
        }).then(function(locks){
            return get_source(url2, locks, conf2);
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

        var url1 = "http://localhost:10000/non_existing.jpg";
        var conf1 = config.get(url1);
        var locks;

        rsvp.hash({
            meta: lock("404_meta"),
            source: lock("404_source"),
        }).then(function(locks) {
            locks = locks;
            return get_source(url1, locks, conf1);
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

    testWhitelistError: function(test) {
        test.expect(1);

        var url1 = "http://foobar/";
        var conf1 = config.get(url1);
        rsvp.hash({
            meta: lock("whitelist_meta"),
            source: lock("whitelist_source"),
        }).then(function(locks) {
            return get_source(url1, locks, conf1);
        }).then(
            function(foo) {
                test.equal("this should not happen", "ever!");
            },
            function(fail) {
                test.strictEqual(fail.name, "UrlWhitelistError");
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

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

var config = require("../lib/config");
var pathutils = require("../lib/pathutils");
var download = require("../lib/download");

var static_image_server;

module.exports = {

    setUp: function(cb) {
        config.load([
            pathutils.join([__dirname, "resources", "test_config.yml"])
        ]);

        var download_root = pathutils.join([
            __dirname,
            "resources",
            "images"
        ]);

        static_image_server = http.createServer(function(req, res){
            send(req, download_root + url.parse(req.url).pathname).pipe(res);
        }).listen(10000);

        cb();
    },

    testSingleDownload: function(test) {
        test.expect(1);

        var url1 = "http://localhost:10000/test_image_sparrow.jpg";
        download(url1).then(function(dir_path) {
            var path = pathutils.join([dir_path, "source"]);
            fs.open(path, "r", function(err, file) {
                test.strictEqual(err, null);
                test.done();
            });
        });
    },

    testParallelDownloads: function(test) {
        test.expect(2);

        var url1 = "http://localhost:10000/test_image_sparrow.jpg";
        var d1 = new Promise(function(resolve, reject) {
            download(url1).then(function(dir_path) {
                var path = pathutils.join([dir_path, "source"]);
                fs.open(path, "r", function(err, file) {
                    test.strictEqual(err, null);
                    resolve();
                });
            });
        });

        var url2 = "http://localhost:10000/test_image_sparrow_2.jpg";
        var d2 = new Promise(function(resolve, reject) {
                download(url2).then(function(dir_path) {
                var path = pathutils.join([dir_path, "source"]);
                fs.open(path, "r", function(err, file) {
                    test.strictEqual(err, null);
                    resolve();
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
        download(url1).then(
            function() {
                test.equal("this should not happen", "ever!");
            },
            function(err) {
                test.strictEqual(err.message, "HTTP 404");
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

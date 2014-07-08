/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var fs = require("fs");
var http = require("http");
var https = require("http");
var rsvp = require("rsvp");
var Promise = rsvp.Promise;
var path_sep = require("path").sep;
var request = require("request");
var parse_url = require("url").parse;

var pathutils = require("./pathutils");
var fsutils = require("./fsutils");
var lock = require("./lock");
var config = require("./config");

var active_downloads = {};

function perform_request(url, source_file_path, meta_file_path) {
    return new Promise(function(resolve, reject) {
        var response_stream;
        /*
         * using `request` this way allows to stream the response 
         * while still being able to react to status codes/headers, etc …
         */
        response_stream = request.get(url);
        response_stream.on("error", function(err) {
            reject(err);
        });
        response_stream.on("response", function(response) {

            if (response.statusCode >= 400) {
                reject(new Error("HTTP " + response.statusCode));
                return;
            }
            var source_promise = new Promise(function(resolve, reject) {
                var write_stream = fs.createWriteStream(source_file_path);

                response_stream.on("end", function() {
                    resolve();
                });

                write_stream.on("error", function(err) {
                    reject(err);
                });

                response_stream.pipe(write_stream);
            });

            var meta_promise = new Promise(function(resolve, reject) {
                var meta_data = {
                    headers: response.headers
                };
                fs.writeFile(meta_file_path, JSON.stringify(meta_data), function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });

            });

            var all_promise = rsvp.all([
                source_promise,
                meta_promise
            ]);

            all_promise.then(resolve);
        });
    });
}



var download = function(url) {
    //var dir_path;
    var promise;

    function removeFromActiveList () {
        if (url in active_downloads) {
            delete active_downloads[url];
        }
    }

    promise = new Promise(function(resolve, reject){
        var download_config;

        try {
            download_config = config.get(url);
        } catch (e) {
            //no config was found for this URL, abort!
            reject(e);
            return;
        }

        var dir_path = pathutils.join([
            download_config.cache.base_path,
            pathutils.getHashPath(url),
        ]);

        resolve(dir_path);
    }).then(
        function(dir_path) {
            return fsutils.mkdirp(dir_path);
        }
    ).then(
        function(dir_path) {
            var source_file_path = pathutils.join([
                dir_path,
                "source"
            ]);
            var meta_file_path = pathutils.join([
                dir_path,
                "meta"
            ]);

            var download_promise = rsvp.all([
                lock(source_file_path),
                lock(meta_file_path)
            ]).then(function(releases) {
                /*
                 * make a funciton to bundle both lock releases
                 *
                 * source image and metadata file sould be locked and unlocked
                 * at the same time because they descripe the state of the same resource
                 */
                function free() {
                    releases.forEach(function(r) { r(); });
                }

                //files are now locked
                return new Promise(function(resolve, reject) {
                    var requests_promise = perform_request(url, source_file_path, meta_file_path);
                    //always call `free()` regardless of the outcome
                    requests_promise.then(function() {
                        free();
                        resolve(dir_path);
                    }, function(err) {
                        free();
                        reject(err);
                    });
                });
            });

            return download_promise;
        }
    );

    // regardless of how the promise finishes,
    // remove this url from the active downloads list
    promise.then(removeFromActiveList, removeFromActiveList);

    return promise;
};

module.exports = function(url) {
    /*
     * if there's already an unresolved promise for this url, return that one
     * instead of starting a second download
     */
    if (!(url in active_downloads)) {
        active_downloads[url] = download(url);
    }

    return active_downloads[url];
};


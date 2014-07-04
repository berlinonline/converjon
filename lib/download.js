/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var fs = require("fs");
var request = require("request");
var Promise = require("rsvp").Promise;
var winston = require("winston");
var path_sep = require("path").sep;

var pathutils = require("./pathutils");
var fsutils = require("./fsutils");
var lock = require("./lock");
var config = require("./config");

var active_downloads = {};

var download = function(url) {
    var file_path;
    var promise;

    function removeFromActiveList () {
        if (url in active_downloads) {
            winston.log("removing from list");
            delete active_downloads[url];
        }
    }

    promise = new Promise(function(resolve, reject){
        var download_config;

        try {
            download_config = config.get(url);
        } catch (e) {
            reject(e);
            return;
        }

        file_path = [
            download_config.cache.base_path,
            pathutils.getHashPath(url),
            "source"
        ].join(path_sep);

        resolve();
    }).then(
        function() {
            return fsutils.mkdirForFile(file_path);
        }
    ).then(
        function(dir_path) {
            winston.log("aquiring lock for", file_path);
            return lock(file_path);
        },
        function(mkdir_error) {
            return mkdir_error;
        }
    ).then(
        function(free){
            //file is now locked
            var download_promise =  new Promise(function(resolve, reject) {
                winston.log("starting dowload");
                request(url, function(error, response, body) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(file_path);
                    }
                }).pipe(fs.createWriteStream(file_path));
            });

            //always call `free()` regardless of the outcome
            download_promise.then(free, free);

            return download_promise;
        }
    );

    // regardless of how the promise finishes,
    // remove this url from the active downloads list
    promise.then(removeFromActiveList, removeFromActiveList);

    return promise;
};

module.exports = function(url) {
    winston.log("download was requested");
    /*
     * if there's already an unresolved promise for this url, return that one
     * instead of starting a second download
     */
    if (!(url in active_downloads)) {
        active_downloads[url] = download(url);
    }

    return active_downloads[url];
};


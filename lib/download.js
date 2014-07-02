/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var fs = require("fs");
var request = require("request");
var Promise = require("rsvp").Promise;
var winston = require("winston");

var active_downloads = {};

var download = function(url) {
    var path = "image.jpg";
    var promise;

    var removeFromActiveList = function() {
        if (url in active_downloads) {
            winston.log("removing from list");
            delete active_downloads[url];
        }
    };

    promise =  new Promise(function(resolve, reject) {
        winston.log("starting dowload");
        request(url, function(error, response, body) {
            if (error) {
                reject(error);
            } else {
                resolve(path);
            }
        }).pipe(fs.createWriteStream(path));
    });

    // regardless of how the promise finishes,
    // remove this url from the active downloads list
    promise.then(removeFromActiveList, removeFromActiveList);

    return promise;
};

module.exports = function(url) {
    winston.log("download was requested");
    if (!(url in active_downloads)) {
        active_downloads[url] = download(url);
    }

    return active_downloads[url];
};


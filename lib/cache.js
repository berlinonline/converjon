/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
"use strict";

var fs = require("fs");

var pathutils = require("./pathutils");
var config = require("./config");
var lock = require("./lock");
var headers_still_fresh = require("./util").headers_still_fresh;
var download = require("./source");
var fsutils = require("./fsutils");
var processing = require("./processing");
var stats = require("./stats");

var rsvp = require("rsvp");
var Promise = rsvp.Promise;

function read_meta_data(item) {
    var promise = new Promise(function(resolve, reject) {
        fs.readFile(item.locks.meta.key, function(err, data) {
            var content;

            if (err) {
                item.error = err;
                reject(item);
                return;
            }

            try {
                content = JSON.parse(data.toString("utf-8"));
            } catch (e) {
                item.error = e;
                reject(item);
            }

            item.meta_data = content;
            resolve(item);
        });
    });

    return promise;
}

function get_target_file(item) {
    var promise = new Promise(function(resolve, reject) {
        fs.exists(item.locks.target.key, function(exists) {
            if (exists) {
                resolve(item);
            } else {
                reject(item);
            }
        });
    }).then(function(item){
        //target file found, nothing to so. just return the item

        //still need to set the default options for later!
        processing.set_default_options(item);
        return item;
    }, function(item) {
        //target file not found, make a new one
        return processing.create_target_file(item);
    });

    return promise;
}

/**
 * returns a promise that resolves into the meta data or rejects in case of an error
 */
function meta_data_still_fresh(item) {
    var promise = read_meta_data(item).
    then(function(item) {
        return new Promise(function(resolve, reject) {
            if (headers_still_fresh(item.meta_data.headers)) {
                resolve(item);
            } else {
                reject(item);
            }
        });
    });

    return promise;
}


/**
 * returns a promise that will either resolve into a file path that can be served to the client
 * or rejected in case of an error
 */
function cache(url, options) {
    var conf = config.get(url);
    var dir_path = pathutils.join([
        conf.cache.base_path,
        pathutils.getHashPath(url),
    ]);

    var meta_path = pathutils.join([dir_path, "meta"]);
    var source_path = pathutils.join([dir_path, "source"]);
    var target_path = pathutils.join([dir_path, pathutils.getOptionsPath(options)]);

    var item = {
        url: url,
        options: options,
        conf: conf,
        locks: {}
    };

    /*
     * lock the files in sequence, not in parallel
     * otherwise a deadlock with other request may occur
     */
    var promise = lock(source_path).then(function(l) {
        item.locks.source = l;
        return lock(meta_path);
    }).then(function(l) {
        item.locks.meta = l;
        return lock(target_path);
    }).then(function(l) {
        item.locks.target = l;
        return item;
    }).
    then(function(item) {
        return meta_data_still_fresh(item);
    }).
    then(function(item) {
        //meta data is still fresh

        return item;
    }, function(item) {
        //meta_data is stale or doesn't exist
        //clear the item directory and download a new version of the source
        var download_promise = fsutils.cleardir(dir_path).
        then(function() {
            return download(url, item.locks, conf);
        }, function(err) {
            // clearing the directory failed.

            // maybe it didn't exists, which would be ok
            if (err.code === "ENOENT") {
                return download(url, item.locks, conf);
            } else {
                //no, it failed for some other reason
                item.error = err;
                return new Promise(function(resolve, reject) {
                    reject(item);
                });
            }
        }).
        then(function(success) {
            //download succeeded
            stats.download_success();
            //now only read metadata, don't evaluate headers or else
            //things with max-age=0 will always fail
            return read_meta_data(item);
        }, function(item) {
            stats.download_failure();
            return new Promise(function(resolve, reject) {
                reject(item);
            });
        });

        return download_promise;
    }).
    then(function(item) {
        //at this point the item is definitely fresh
        return get_target_file(item);
    }).
    then(function(item) {
        //the target has also been found. all done! \o/
        item.locks.meta();
        (item.locks.source || function(){})(); //with fallback, source lock is not always set
        return item;
    },function(item) {
        item.locks.meta();
        item.locks.source();
        item.locks.target();

        /*
         * wrap the error in a new rejected promise
         * otherwise the return will be considered "resolved"
         * and the error handler will not fire
         */
        return new Promise(function(resolve, reject) {
            reject(item);
        });
    });

    return promise;
}

module.exports = cache;

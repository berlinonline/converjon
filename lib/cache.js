/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
"use strict";

var fs = require("fs");

var pathutils = require("./pathutils");
var config = require("./config");
var lock = require("./lock").lock;
var headers_still_fresh = require("./util").headers_still_fresh;
var source = require("./source");
var fsutils = require("./fsutils");
var processing = require("./processing");
var stats = require("./stats");
var logging = require("./logging");
var garbage = require("./garbage");

var rsvp = require("rsvp");
var Promise = rsvp.Promise;

var conf = config.get();

if (conf.garbage_collector.enabled) {
    garbage.start();
}

function register_for_gc(item) {
    var h = item.meta_data.headers;
    var l = item.locks;
    if (item.source_type !== "file" || item.conf.cache.copy_source_file) {
        //external source files should not be cleaned up!
        garbage.register_file(l.source.key, h);
    }
    garbage.register_file(l.meta.key, h);
    garbage.register_file(l.target.key, h);
}

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
    var promise = fsutils.file_exists(item.locks.target.key).then(function(){
        //target file found, nothing to so. just return the item
        logging.debug(item.id, "Target file already exists");

        //still need to set the default options for later!
        processing.set_default_options(item);
        return item;
    }, function() {
        //target file not found, make a new one
        logging.debug(item.id, "Target file doesn't exist. Must be regenerated.");
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
function cache(item, options) {
    var dir_path = pathutils.join([
        item.conf.cache.base_path,
        pathutils.getHashPath(item.source),
    ]);

    var meta_path = pathutils.join([dir_path, "meta"]);
    var source_path = pathutils.join([dir_path, "source"]);

    if (item.source_type === "file" && !item.conf.cache.copy_source_file) {
        source_path = item.source;
    }

    var target_path = pathutils.join([dir_path, pathutils.getOptionsPath(options)]);


    /*
     * lock the files in sequence, not in parallel
     * otherwise a deadlock with other request may occur
     */
    var promise = lock(source_path).then(function(l) {
        logging.debug(item.id, "Locked: source file");
        item.locks.source = l;
        return lock(meta_path);
    }).then(function(l) {
        logging.debug(item.id, "Locked: metadata");
        item.locks.meta = l;
        return lock(target_path);
    }).then(function(l) {
        logging.debug(item.id, "Locked: target file");
        item.locks.target = l;
        return item;
    }).
    then(function(item) {
        return meta_data_still_fresh(item);
    }).
    then(function(item) {
        //meta data is still fresh
        logging.debug(item.id, "Metadata is still fresh");

        return item;
    }, function(item) {
        //meta_data is stale or doesn't exist
        logging.debug(item.id, "Metadata is stale");
        //clear the item directory and download a new version of the source
        var source_promise = fsutils.cleardir(dir_path).
        then(function() {
            logging.debug(item.id, "Item directory cleared");
            logging.debug(item.id, "Requesting source", item.source);
            return source(item, item.locks, item.conf, item.id);
        }, function(err) {
            // clearing the directory failed.
            // maybe it didn't exists, which would be ok
            if (err.code === "ENOENT") {
                logging.debug(item.id, "Requesting download", item.url);
                return source(item, item.locks, item.conf, item.id);
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
            logging.debug(item.id, "Source file ready");
            stats.download_success();
            //now only read metadata, don't evaluate headers or else
            //things with max-age=0 will always fail
            return read_meta_data(item);
        }, function(error) {
            logging.debug(item.id, "Download failed");
            stats.download_failure();
            return new Promise(function(resolve, reject) {
                reject(item);
            });
        });

        return source_promise;
    }).
    then(function(item) {
        //at this point the item is definitely fresh
        return get_target_file(item);
    }).
    then(function(item) {
        //the target has also been found. all done! \o/
        item.locks.meta();
        logging.debug(item.id, "Released lock: metadata");
        if (typeof item.locks.source === "function") {
            item.locks.source();
            logging.debug(item.id, "Released lock: source file");
        } else {
            //
        }

        register_for_gc(item);
        return item;
    },function(item) {
        item.locks.meta();
        logging.debug(item.id, "Released lock: metadata");
        item.locks.source();
        logging.debug(item.id, "Released lock: source file");
        item.locks.target();
        logging.debug(item.id, "Released lock: target file");

        register_for_gc(item);
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

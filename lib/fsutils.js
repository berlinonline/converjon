/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var path = require("path");

var rsvp = require("rsvp");
var Promise = rsvp.Promise;
var __mkdirp = require("mkdirp");
var fs = require("fs");
var pathutils = require("./pathutils");

function file_system_error(err) {
    err.name = "FileSystemError";
    return err;
}

var mkdirp = function(dir_path) {
    return new Promise(function(resolve, reject) {
        __mkdirp(dir_path, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(dir_path);
            }
        });
    });
};

function rm(path) {
    return new Promise(function(resolve, reject) {
        fs.stat(path, function(err, stat) {
            if (err) {
                    reject(file_system_error(err));
                return;
            }

            if (stat.isFile()) {
                fs.unlink(path, function(err) {
                    if (err) {
                        reject(file_system_error(err));
                    } else {
                        resolve(path);
                    }
                });
            } else if (stat.isDirectory()) {
                cleardir(path).then(function() {
                    fs.rmdir(path, function(err) {
                        if (err) {
                            reject(file_system_error(err));
                        } else {
                            resolve(path);
                        }
                    });
                });
            } else {
                reject(file_system_error(new Error(path + " is not a file or directory")));
            }
        });
    });
}

function cleardir(path) {
    return new Promise(function(resolve, reject) {
        fs.readdir(path, function(err, dir) {
            if (err) {
                reject(file_system_error(err));
                return;
            }

            resolve(rsvp.all(dir.map(function(item) {
                //console.log("deleting", item);
                return rm(pathutils.join([path, item]));
            })));
        });
    });
}

/**
 * returns a promise that resolves into the path lock if it exists.
 * otherwise it rejects with the path as argument.
 */
function file_exists(path_lock) {
    return new Promise(function(resolve, reject) {
        fs.exists(path_lock.key, function(exists) {
            if (exists) {
                resolve(path_lock);
            } else {
                reject(path_lock);
            }
        });
    });
}

module.exports = {
    mkdirp: mkdirp,
    cleardir: cleardir,
    file_exists: file_exists,
    mkdirForFile: function(file_path) {
        return mkdirp(path.dirname(file_path));
    },
    file_system_error: file_system_error
};


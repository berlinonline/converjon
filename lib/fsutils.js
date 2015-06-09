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
                return rm(pathutils.join([path, item]));
            })));
        });
    });
}

function file_exists(path) {
    return new Promise(function(resolve, reject) {
        fs.exists(path, function(exists) {
            if (exists) {
                resolve(path);
            } else {
                reject(path);
            }
        });
    });
}

function find_first_existing_path(paths) {
    var promise = new Promise(function(resolve, reject) {
        reject();
    });

    /*
     * the promise is initially rejected, for each path, a new .then call is added.
     * if the .then call recieves a rejected promise, it gous on to the next path
     * in the array. the resolve handlers are empty, so the resolved value will just come
     * out at the end of the chain, skipping unnecessary steps.
     */
    return paths.reduce(function(p, path) {
        return p.then(null, function() {
            return file_exists(path);
        });
    }, promise);
}

function realpath(path) {
    return new Promise(function(resolve, reject) {
        fs.realpath(path, function(err, resolved) {
            if (err) {
                reject(err);
            } else {
                resolve(resolved);
            }
        });
    });
}

module.exports = {
    rm: rm,
    mkdirp: mkdirp,
    cleardir: cleardir,
    file_exists: file_exists,
    find_first_existing_path: find_first_existing_path,
    mkdirForFile: function(file_path) {
        return mkdirp(path.dirname(file_path));
    },
    realpath: realpath,
    file_system_error: file_system_error
};


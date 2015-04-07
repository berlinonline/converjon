/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var fs = require("fs");
var rsvp = require("rsvp");
var Promise = rsvp.Promise;
var path_sep = require("path").sep;
var request = require("request");
var parse_url = require("url").parse;
var match = require("./match");

var pathutils = require("./pathutils");
var fsutils = require("./fsutils");
var lock = require("./lock");
var analyze = require("./analyze");
var logging = require("./logging");

var active_list = {};

function source_http_error(err, code) {
    err.name = "SourceHttpError";
    err.code = code;
    return err;
}

function url_whitelist_error(err) {
    err.message = "Downloading from URL '"+err.message+"' is not allowed";
    err.name = "UrlWhitelistError";
    return err;
}

function write_source_files(url, locks, config, id) {
    var source_file_path = locks.source.key;
    var meta_file_path = locks.meta.key;

    return new Promise(function(resolve, reject) {
        var response_stream;
        /*
         * using `request` this way allows to stream the response 
         * while still being able to react to status codes/headers, etc …
         */
        var request_options = {};

        if (typeof config.authentication !== "undefined") {
            if (typeof config.authentication.username !== "undefined" &&
                typeof config.authentication.password !== "undefined") {
                request_options.auth = {
                    user: config.authentication.username,
                    pass: config.authentication.password,
                    sendImmediately: true
                };
            }
        }

        if (config.download.timeout) {
            request_options.timeout = config.download.timeout;
        }

        if (config.download.rejectInvalidSSL) {
            request_options.strictSSL = config.download.rejectInvalidSSL;
        }

        logging.debug(id, "Starting request", url);
        response_stream = request.get(url, request_options);
        response_stream.on("error", function(err) {
            var message;

            switch (err.message) {
                case "connect ECONNREFUSED":
                    message = "Source server refused connection";
                    break;
                default:
                    message = "Unknown error while requesting source";
            }

            reject(source_http_error(new Error(message), 400));
        });
        response_stream.on("response", function(response) {
            if (response.statusCode > 200) {
                logging.debug(id, "Received invalid response");

                var error = source_http_error(
                    new Error("Source server gave an unexpected response code: " + response.statusCode),
                    response.statusCode
                );

                reject(error);
                return;
            }

            logging.debug(id, "Received OK response");

            var writing_promise = new Promise(function(resolve, reject) {
                var length = 0;
                var write_stream = fs.createWriteStream(source_file_path);

                response_stream.on("end", function() {
                    logging.debug(id, "Download finished");
                    if (length > 0) {
                        resolve();
                    } else {
                        reject(fsutils.file_system_error(new Error(
                            "Source file has length 0"
                        )));
                    }
                });

                response_stream.on("data", function(chunk) {
                    length += chunk.length;
                });

                write_stream.on("error", function(err) {
                    logging.debug(id, "Download error");
                    reject(fsutils.file_system_error(err));
                });

                response_stream.pipe(write_stream);
            });

            writing_promise.then(function() {
                logging.debug(id, "Requesting anaylsis");
                return analyze(locks.source, config, id);
            }).then(function(analysis_report) {
                //promise for writing the metadata
                logging.debug(id, "Writing metadata file");
                return new Promise(function(resolve, reject) {
                    var meta_data = {
                        headers: response.headers,
                        analysis: analysis_report
                    };
                    fs.writeFile(meta_file_path, JSON.stringify(meta_data), function(err) {
                        if (err) {
                            logging.debug(id, "Writing metadata failed");
                            reject(fsutils.file_system_error(err));
                        } else {
                            logging.debug(id, "Metadata ready");
                            resolve();
                        }
                    });

                });
            }).then(
                function(){
                    resolve({
                        id: id,
                        locks: locks
                    });
                },
                function(err) {
                    reject({
                        id: id,
                        error: err,
                        locks: locks
                    });
                }
            );
        });
    });
}

function check_url_whitelist(url, config) {
    var whitelist = config.download.url_whitelist;
    var i;

    for( i = 0; i < whitelist.length; i++) {
        if (match(whitelist[i], url)) {
            return true;
        }
    }

    return false;
}

var get_source = function(url, locks, config, id) {

    function removeFromActiveList () {
        if (url in active_list) {
            delete active_list[url];
        }
    }

    var promise = new Promise(function(resolve, reject) {
        if (check_url_whitelist(url, config)) {
            resolve();
        } else {
            reject(url_whitelist_error(new Error(url)));
        }
    }).then(function() {
        return fsutils.mkdirForFile(locks.meta.key);
    }).
    then(function(dir_path) {
        return fsutils.mkdirForFile(locks.source.key);
    }).
    then(function(dir_path) {
        return write_source_files(url, locks, config, id);
    });

    // regardless of how the promise finishes,
    // remove this url from the active downloads list
    promise.then(removeFromActiveList, removeFromActiveList);

    return promise;
};

module.exports = function(url, locks, config, id) {
    /*
     * if there's already an unresolved promise for this url, return that one
     * instead of starting a second download of source files
     */
    if (!(url in active_list)) {
        active_list[url] = get_source(url, locks, config, id);
    }

    return active_list[url];
};


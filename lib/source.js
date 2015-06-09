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
var lock = require("./lock").lock;
var analyze = require("./analyze");
var logging = require("./logging");

var active_list = {};

function source_http_error(err, code) {
    err.name = "SourceHttpError";
    err.code = code;
    return err;
}

function analyze_result(item, headers) {
    var locks = item.locks;
    var id = item.id;
    var conf = item.conf;

    logging.debug(id, "Requesting anaylsis");
    var analysis_promise = analyze(locks.source, conf, id).
    then(function(analysis_report) {
        //promise for writing the metadata
        logging.debug(id, "Writing metadata file");
        return new Promise(function(resolve, reject) {
            var meta_data = {
                headers: item.source_headers,
                analysis: analysis_report
            };
            fs.writeFile(locks.meta.key, JSON.stringify(meta_data), function(err) {
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
            return {
                id: id,
                locks: locks
            };
        },
        function(item) {
            throw item;
        }
    );

    return analysis_promise;
}


function download_source(item) {
    var url = item.source;
    var conf = item.conf;
    var id = item.id;
    var locks = item.locks;
    var source_file_path = locks.source.key;
    var meta_file_path = locks.meta.key;

    return new Promise(function(resolve, reject) {
        var response_stream;
        /*
         * using `request` this way allows to stream the response
         * while still being able to react to status codes/headers, etc …
         */
        var request_options = {};

        if (typeof conf.authentication !== "undefined") {
            if (typeof conf.authentication.username !== "undefined" &&
                typeof conf.authentication.password !== "undefined") {
                request_options.auth = {
                    user: conf.authentication.username,
                    pass: conf.authentication.password,
                    sendImmediately: true
                };
            }
        }

        if (conf.download.timeout) {
            request_options.timeout = conf.download.timeout;
        }

        if (conf.download.rejectInvalidSSL) {
            request_options.strictSSL = conf.download.rejectInvalidSSL;
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
            } else {
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

                item.source_headers = response.headers;
                resolve(writing_promise);
            }
        });
    });
}

function copy_source(item) {
    return new Promise(function(resolve, reject) {
        var target_stream = fs.createWriteStream(item.locks.source.key);
        var source_stream = fs.createReadStream(item.source);

        source_stream.pipe(target_stream);

        source_stream.on("end", function() {
            resolve();
        });

        target_stream.on("error", function(err) {
            reject(fsutils.file_system_error(err));
        });

        source_stream.on("error", function(err) {
            reject(fsutils.file_system_error(err));
        });
    });
}


var get_source = function(item) {
    var source = item.source;

    function removeFromActiveList () {
        if (source in active_list) {
            delete active_list[source];
        }
    }

    var promise = fsutils.mkdirForFile(item.locks.meta.key).
    then(function(dir_path) {
        return fsutils.mkdirForFile(item.locks.source.key);
    }).
    then(function(dir_path) {
        switch (item.source_type) {
            case "url": return download_source(item);
            case "file": 
                item.source_headers = item.conf.headers || {};
                item.source_headers.date = (new Date()).toUTCString();
                if (item.conf.cache.copy_source_file) {
                    return copy_source(item);
                } else {
                    logging.debug(item.id, "Using original local file as source:", item.source);
                    return;
                }
                break;
            default: throw new Error("Invalid source type. Only 'url' and 'file' are allowed.");
        }
    }).
    then(function() {
        return analyze_result(item);
    });

    // regardless of how the promise finishes,
    // remove this url from the active downloads list
    promise.then(removeFromActiveList, removeFromActiveList);

    return promise;
};

module.exports = function(item) {
    var source = item.source;
    /*
     * if there's already an unresolved promise for this url, return that one
     * instead of starting a second download of source files
     */
    if (!(source in active_list)) {
        active_list[source] = get_source(item);
    }

    return active_list[source];
};


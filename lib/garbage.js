var locking = require("./lock");
var fs = require("fs");
var path = require("path");
var RSVP = require("rsvp");
var Promise = RSVP.Promise;
var fsutils = require("./fsutils");
var config = require("./config");
var util = require("./util");
var logging = require("./logging");

var known_files = [];
var headers = {};
var conf = config.get().garbage_collector;
var timer;
var running;

function register_file(file_path, file_headers) {
    headers[file_path] = file_headers;
    if (known_files.indexOf(file_path) < 0) {
        known_files.push(file_path);
    }
}

function attempt_cleanup(path) {
    logging.debug("GC: Attempting cleanup of", path);
    return new Promise(function(resolve, reject) {
        if (locking.is_free(path)) {
            locking.lock(path).then(function(lock) {
                return delete_file(lock);
            }).then(function() {
                logging.debug("GC: Removed", path);
                resolve();
            }, function(err){
                if (err.code === "ENOENT") {
                    //file didn't exist. ok, so we don't need to delete it.
                    resolve();
                } else {
                    //something else went wrong
                    logging.error(err.message);
                    reject();
                }
            });
        } else {
            logging.debug("GC: Resource is still in use", path);
            reject();
        }
    });
}

function delete_file(lock) {
    return fsutils.rm(lock.key).then(function(file_path) {
        lock();
    }, function(err) {
        lock();
        throw err;
    });
}

function check_file(file_path) {
    var base_name = path.basename(file_path);
    var h = headers[file_path];

    if (base_name === "source" || base_name === "meta") {
        if (conf.source === "cache") {
            return util.headers_still_fresh(h);
        } else if (conf.source === "immediate") {
            return false;
        }
    } else {
        if (conf.target === "cache") {
            return util.headers_still_fresh(h);
        } else if (conf.target === "immediate") {
            return false;
        }
    }

    return true;
}

function tick() {
    clearTimeout(timer);
    var files_to_cleanup = [];

    //filter out all files that need to be cleaned up
    known_files = known_files.filter(function(file_path) {
        if (check_file(file_path)) {
            return true;
        } else {
            files_to_cleanup.push(file_path);
            delete headers[file_path];
            return false;
        }
    });

    return RSVP.all(files_to_cleanup.map(function(file_path) {
        return attempt_cleanup(file_path);
    })).catch(function(err){
        logging.error(err.message);
    }).finally(function() {
        if (running) {
            setTimeout(tick, conf.interval);
        }
    });
}

function start() {
    running = true;
    timer = setTimeout(tick, conf.interval);
}

function stop() {
    clearTimeout(timer);
    running = false;
}

module.exports = {
    register_file: register_file,
    start: start,
    stop: stop
};

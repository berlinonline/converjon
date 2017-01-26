/* jshint globalstrict: true */
/* global require */
/* global module */
/* global process */
/* global __dirname */
/* global setTimeout */
/* global clearTimeout */

"use strict";
var config = require("../lib/config");
var conf = config.get();
var http = require("http");
var url_parse = require("url").parse;
var send = require("send");
var fs = require("fs");
var path = require("path");
var Promise = require("rsvp").Promise;

var cache = require("./cache");
var handle_error_response = require("./server/errors");

var demo_page = require("./server/demo_page.js");
var status_page = require("./server/status_page.js");
var status_page_json = require("./server/status_page_json.js");
var logging = require("./logging");
var stats = require("./stats");
var match = require("./match");
var fsutils = require("./fsutils");
var load_test = require("./server/load_test.js");

var mime_map = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "gif": "image/gif",
    "png": "image/png"
};

function get_format_mime(format) {
    if (typeof mime_map[format] !== "undefined") {
        return mime_map[format];
    } else {
        return "application/octet-stream";
    }
}

var original_header_whitelist = [
    "cache-control",
    "date",
    "expires",
    "last-modified",
    "etag"
];

function add_original_headers(res, item) {
    var headers = item.meta_data.headers;
    var i;

    Object.keys(headers).reduce(function(carry, current) {
        if (original_header_whitelist.indexOf(current.toLowerCase()) >= 0) {
            res.setHeader(current, headers[current]);
        }
        return res;
    }, res)
}

function add_default_headers(res, item) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
}

var get_item_id = (function(){
    var item_id = 0;
    return function get_item_id() {
        return item_id++;
    };
})();

function url_whitelist_error(err) {
    err.message = "Downloading from URL '"+err.message+"' is not allowed";
    err.name = "UrlWhitelistError";
    return err;
}

function server_error(err) {
    err.name = "ServerError";
    return err;
}

function check_url_whitelist(url, conf) {
    var whitelist = conf.download.url_whitelist;
    var i;

    for( i = 0; i < whitelist.length; i++) {
        if (match(whitelist[i], url)) {
            return true;
        }
    }

    return false;
}

function handle_source_file_path(source, item) {
    var alias, source_path;
    return new Promise(function(resolve, reject) {
        var matches = source.match(/(\w+):(.+)/);

        if (matches) {
            alias = matches[1];
            source_path = path.normalize(matches[2]);
            if (source_path.indexOf("..") === 0) {
                item.error = new Error("Invalid path '"+source_path+"'.");
                reject(item);
                return;
            }
        } else {
            item.error = new Error("Invalid 'file' parameter. 'file' has to be in the format 'alias:path', e.g. ''photos:foo/bar/example.jpg'");
            reject(item);
            return;
        }
        item.conf = config.get(alias);
        item.source = source_path;

        var base_path = conf.base_file_path;
        if (!base_path) {
            reject(new Error("No base path configured for alias '"+alias+"'."));
            return;
        }

        var fallback_base_paths = conf.fallback_base_file_paths;
        var paths = [base_path].concat(fallback_base_paths).map(function(p){
            return path.join(p, source_path);
        });


        resolve(paths);
    }).then(function(base_paths) {
        return fsutils.find_first_existing_path(base_paths).catch(function() {
            item.error = new Error("No fallback path found");
            throw item;
        });
    }).then(function(found_path) {
        logging.debug(item.id, "Found local file", found_path);
        item.source = found_path;
    });
}

function image_request(url, req, res) {
    var response_closed = false;
    res.addListener("close", function(e) {
        //remember, if the client has already canceled the request
        response_closed = true;
    });
    var options = url.query;

    var item = {
        id: get_item_id(),
        source: null,
        meta_data: {},
        options: options,
        conf: {},
        locks: {}
    };

    new Promise(function(resolve, reject) {
        if (options.file) {
            resolve(handle_source_file_path(options.file, item).then(function() {
                item.source_type = "file";
            }));
        } else if (options.url) {
            item.source = options.url;
            item.source_type = "url";
            item.conf = config.get(options.url);
            if (!check_url_whitelist(item.source, item.conf)) {
                item.error = url_whitelist_error(new Error(item.source));
                reject(item);
            } else {
                resolve();
            }
        } else {
            item.error = server_error(new Error(
                    "URL and file parameter are both missing! At least one is required."
            ));
            reject(item);
        }
    }).then(function(){
        delete options.url;
        delete options.file;

        return cache(item, options);
    }).then(function(item) {
        var send_timer;

        var ended = false;
        function end(ev) {
            clearTimeout(send_timer);
            if (!ended) {
                logging.debug(item.id, "Releasing lock: target file");
                item.locks.target();
                res.end(); //make sure it's ended!
                stats.request_success();
                ended = true;
            }
        }

        if (response_closed) {
            //no ones listening anymore
            end();
            return;
        }

        send_timer = setTimeout(function(){
            end();
        }, conf.server.send_timeout);

        add_default_headers(res, item);
        add_original_headers(res, item);

        if (item.source_type === "url" && conf.source_url_header) {
            logging.debug(item.id, "Setting source URL response header");
            res.setHeader("X-Source-Url", item.source);
        }

        res.setHeader("Content-Type", get_format_mime(item.options.format));
        fs.stat(item.locks.target.key, function(err, stat) {
            if (err) {
                item.error = err;
                handle_error_response(item, res);
                return;
            }

            res.setHeader("Content-Length", stat.size);

            var send_stream = fs.createReadStream(item.locks.target.key);

            send_stream.addListener("end", end);
            send_stream.addListener("error", end);
            send_stream.addListener("close", end);

            send_stream.pipe(res);

            req.on("close", function() {
                /*
                 * make sure the read stream is closed if the request ends before
                 * it is completely consumed.
                 * this will also ensure that the open file descriptor is closed
                 */
                 send_stream.destroy();
            });
        });
    }, function(item) {
        handle_error_response(item, res);
    });
}

function make_access_log_entry(req, res) {
    var log;
    var format = conf.server.access_log_format;

    if (format === "combined") {
        //format the log message as "common log format"
        log = [
            req.connection.remoteAddress,
            "-", //user identifier
            "-", //user id
            (new Date()).toUTCString(),
            "\"" + req.method + " " + req.url + " HTTP " + req.httpVersion + "\"",
            res.statusCode,
            res._headers ? res._headers["content-length"] || 0 : 0
        ];

    } else if (format === "short") {
        log = [
            req.connection.remoteAddress,
            "\"" + req.method + " " + req.url + " HTTP " + req.httpVersion + "\"",
            res.statusCode,
            res._headers ? res._headers["content-length"] || 0 : 0
        ];
    }

    return log.join(" ");
}

var server = http.createServer(function(req, res) {
    var url = url_parse(req.url, true);
    var base_url_path = conf.server.base_url_path;

    res.on("finish", function(ev){
        logging.access(make_access_log_entry(req, res));
    });

    switch (url.pathname) {
        case base_url_path:
            //normal image request
            image_request(url, req, res);
            break;
        case base_url_path + "status":
            status_page(res);
            break;
        case base_url_path + "status.json":
            status_page_json(res);
            break;
        case base_url_path + "demo":
            demo_page(res);
            break;
        case "/loadtest":
            if (conf.server.enable_load_test) {
                load_test(res);
                break;
            }
            /* falls through */
        default:
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/plain");
            res.end("Resource doesn't exist.");
    }
});

server.timeout = conf.server.timeout;


//run the startup procedure and then launch the server
require("./server/startup")(function(){
    server.on("error", function(error) {
        if (error.code === "EADDRINUSE") {
            process.stderr.write(
                "[ERROR] Couldn't start converjon server as port " + conf.server.port + " is already in use.\n"
            );
            process.exit(1);
        }
    });
    server.on("listening", function(ev) {
        logging.info("Converjon server now listens on port " + conf.server.port);
    });

    server.listen(conf.server.port);

    //start the test server as well if configured
    if (conf.test_server.enabled) {
        require("../test/utils/test_server")(conf.test_server.port);
    }
});

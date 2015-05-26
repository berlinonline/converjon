/* jshint globalstrict: true */
/* global require */
/* global module */
/* global process */
/* global __dirname */

"use strict";
var config = require("../lib/config");
var conf = config.get();
var http = require("http");
var url_parse = require("url").parse;
var send = require("send");
var fs = require("fs");

var cache = require("./cache");
var handle_error_response = require("./server/errors");

var demo_page = require("./server/demo_page.js");
var status_page = require("./server/status_page.js");
var status_page_json = require("./server/status_page_json.js");
var logging = require("./logging");
var stats = require("./stats");

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

    for(i in headers) {
        if (headers.hasOwnProperty(i)) {
            if (original_header_whitelist.indexOf(i.toLowerCase() >= 0)) {
                res.setHeader(i, headers[i]);
            }
        }
    }
}

function image_request(url, req, res) {
    var options = url.query;
    var source_url = options.url;

    if (!source_url) {
        handle_error_response({error: new Error("URL parameter is missing!")}, res);
        return;
    }

    var response_closed = false;
    delete options.url;
    res.addListener("close", function(e) {
        //remember, if the client has already canceled the request
        response_closed = true;
    });
    cache(source_url, options).then(function(item) {
        var ended = false;
        function end(ev) {
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
        /*
        setTimeout(function(){
            item.locks.target();
        },2000);
        */

        add_original_headers(res, item);

        res.setHeader("X-Source-Url", item.url);
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

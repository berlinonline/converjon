/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
/* global console */

"use strict";
var config = require("../lib/config");
var conf = config.get();
var http = require("http");
var url_parse = require("url").parse;
var send = require("send");
var fs = require("fs");

var cache = require("./cache");

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

function image_request(url, req, res) {
    var options = url.query;
    var source_url = options.url;
    var response_closed = false;
    delete options.url;
    res.addListener("close", function(e) {
        //remember, if the client has already canceled the request
        response_closed = true;
    });
    cache(source_url, options).then(function(item) {
        function end(ev) {
            item.locks.target();
        }

        if (response_closed) {
            //no ones listening anymore
            end();
            return;
        }
        /*
        setTimeout(function(){
            console.log("LOCK release after timeout");
            item.locks.target();
        },2000);
        */
        res.setHeader("Content-Type", get_format_mime(item.options.format));
        var send_stream = fs.createReadStream(item.locks.target.key);

        send_stream.addListener("end", end);
        send_stream.addListener("error", end);
        send_stream.addListener("close", end);

        send_stream.pipe(res);
    }, function(err) {
        console.log("Error:", err);
        res.end();
    });
}

http.createServer(function(req, res) {
    var url = url_parse(req.url, true);

    switch (url.pathname) {
        case "/":
            //normal image request
            image_request(url, req, res);
            break;
        case "/status":
            //status page
            break;
        case "/demo":
            //demo page
            break;
        default:
            //wtf do you want from me?
            res.end("WAT?");
    }
}).listen(conf.server.port);

//start the test server if configured
if (conf.test_server.enabled) {
    require("../test/utils/test_server")(conf.test_server.port);
}

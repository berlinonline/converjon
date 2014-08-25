/* jshint globalstrict: true */
/* global require */
/* global module */
/* global Buffer */
/* global __dirname */
"use strict";

var http = require("http");
var url_parse = require("url").parse;
var send = require("send");
var pathutils = require("../../lib/pathutils");
var fs = require("fs");

var download_root = fs.realpathSync(pathutils.join([
    __dirname,
    "..",
    "resources",
    "images"
]));

var checkAuth = function(req) {
    var username, password;
    var auth_regex = /^Basic (.+)/;
    if ('authorization' in req.headers) {
        var matches = auth_regex.exec(req.headers.authorization);
        if (matches) {
            var auth = new Buffer(matches[1], 'base64').toString('ascii').split(':');
            if (auth.length === 2) {
                username = auth[0];
                password = auth[1];
                if (username == 'testuser' && password == 'testpass') {
                    return true;
                }
            }
        }
    }

    return false;
};

var valid_file_paths = [
    "/test_image_sparrow.jpg",
    "/test_image_sparrow_2.jpg",
    "/broken_file.jpg"
];

function deliver(req,res) {
    var pathname = url_parse(req.url).pathname;
    if (valid_file_paths.indexOf(pathname) >= 0) {
        res.setHeader('Content-Type', "image/jpeg" + '; charset=binary;');
        fs.createReadStream(download_root + pathname).pipe(res);
    } else {
        res.statusCode = 404;
        res.end();
    }
}

function start_test_server(port) {
    var server = http.createServer(function(req,res) {
        if (req.url == '/url_with_wrong_mime_type') {
            res.setHeader('Content-Type', 'text/plain');
            res.end();

        } else if (req.url == '/broken_file.jpg') {
            res.setHeader('Content-Type', 'image/jpeg');
            deliver(req, res);

        } else if (req.url == '/invalid_mime_type') {
            res.setHeader('Content-Type', 'image/;');
            req.url = '/test_image_sparrow.jpg';
            deliver(req, res);

        } else if (req.url == '/authenticated_url') {
            if (checkAuth(req)) {
                req.url = '/test_image_sparrow.jpg';
                deliver(req, res);
            } else {
                res.statusCode = 401;
                res.setHeader('WWW-Authenticate', 'Basic realm=testing');
                res.end();
            }

        } else {
            deliver(req, res);
        }
    });

    server.listen(port);

    return server;
}

module.exports = start_test_server;

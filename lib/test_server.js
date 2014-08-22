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
var pathutils = require("./pathutils");

var images_dir = fs.realpathSync(pathutils.join([
    __dirname,
    "..",
    "test",
    "resources",
    "images"
]));

http.createServer(function(req, res){
    send(req, images_dir + url_parse(req.url).pathname).pipe(res);
}).listen(conf.test_server.port);

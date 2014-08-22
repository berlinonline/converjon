/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
/* global console */

"use strict";

var pathutils = require("../lib/pathutils");
var config = require("../lib/config");
config.load([
    pathutils.join([__dirname, "..", "test", "resources", "test_config.yml"])
]);
var cache = require("../lib/cache");

var http = require("http");
var url = require("url");
var send = require("send");
var fs = require("fs");


var download_root = fs.realpathSync(pathutils.join([
    __dirname,
    "..",
    "test",
    "resources",
    "images"
]));

var static_image_server = http.createServer(function(req, res){
    res.setHeader("Cache-Control", "max-age=10");
    send(req, download_root + url.parse(req.url).pathname).pipe(res);
}).listen(10000);

var url1 = "http://localhost:10000/test_image_sparrow.jpg";

var options = {
    width: 100,
    height: 100,
    format: "jpg"
};

cache(url1, options).
then(function(item) {
    console.log("target path", item.locks.target.key);
    static_image_server.close(function(){});
}, function(err) {
    console.log("error", err, err.stack);
    static_image_server.close(function(){});
});

/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
/* global console */

"use strict";

var pathutils = require("./lib/pathutils");
var config = require("./lib/config");
config.load([
    pathutils.join([__dirname, "test", "resources", "test_config.yml"])
]);

var http = require("http");
var url = require("url");
var send = require("send");
var cache = require("./lib/cache");


var download_root = pathutils.join([
    __dirname,
    "test",
    "resources",
    "images"
]);

var static_image_server = http.createServer(function(req, res){
    send(req, download_root + url.parse(req.url).pathname).pipe(res);
}).listen(10000);

var url1 = "http://localhost:10000/test_image_sparrow.jpg";

var options = {
    w: 100,
    h: 100,
    format: "jpg"
};

cache(url1, options).
then(function(target_path) {
    console.log("target path", target_path);
    static_image_server.close(function(){});
}, function(err) {
    console.log("error", err, err.stack);
    static_image_server.close(function(){});
});

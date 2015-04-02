/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
"use strict";

var Handlebars = require("handlebars");
var pathutils = require("../pathutils");
var fs = require("fs");
var conf = require("../config").get();

var template_path = fs.realpathSync(pathutils.join([
    __dirname,
    "..",
    "..",
    "resources",
    "demo.handlebars"
]));

var source = fs.readFileSync(template_path).toString("utf-8");
var template = Handlebars.compile(source);

var css_path = fs.realpathSync(pathutils.join([
    __dirname,
    "..",
    "..",
    "resources",
    "demo_style.css"
]));

var style = fs.readFileSync(css_path);

var base = "/?url=";

var url_original = "http://localhost:"+conf.test_server.port+"/test_image_sparrow_smaller.jpg";

var url1 = encodeURIComponent(
    "http://localhost:"+conf.test_server.port+"/test_image_sparrow.jpg"
);

var url2 = encodeURIComponent(
    "http://localhost:"+conf.test_server.port+"/test_image_sparrow_2.jpg"
);

var url3 = encodeURIComponent(
    "http://localhost:"+conf.test_server.port+"/test_image_sparrow_smaller.jpg"
);

var body = template({
    style: style,
    base: base,
    url1: url1,
    url2: url2,
    url3: url3,
    url_original: url_original
});

module.exports = function(res) {
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Length", body.length);
    res.end(body);
};

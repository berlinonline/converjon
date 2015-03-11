/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
"use strict";

var Handlebars = require("handlebars");
var pathutils = require("../pathutils");
var fs = require("fs");

var template_path = fs.realpathSync(pathutils.join([
    __dirname,
    "..",
    "..",
    "resources",
    "status.handlebars"
]));
var source = fs.readFileSync(template_path).toString("utf-8");
var template = Handlebars.compile(source);

var css_path = fs.realpathSync(pathutils.join([
    __dirname,
    "..",
    "..",
    "resources",
    "status_style.css"
]));

var style = fs.readFileSync(css_path);

var info = require("../info");
var stats = require("../stats");

module.exports = function(res) {
    var data = {
        info: info(),
        stats: stats.get_report(),
        style: style
    };

    res.setHeader("Content-Type", "text/html");
    var body = template(data);
    res.setHeader("Content-Length", body.length);
    res.end(body);
};

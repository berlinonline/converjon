/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
"use strict";

var info = require("../info");
var stats = require("../stats");

module.exports = function(res) {
    var data = {
        info: info(),
        stats: stats.get_report()
    };

    res.setHeader("Content-Type", "application/json");
    var body = JSON.stringify(data);
    res.setHeader("Content-Length", body.length);
    res.end(body);
};

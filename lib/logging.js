/* jshint globalstrict: true */
/* global require */
/* global module */
/* global console */
"use strict";

var conf = require("./config").get();
var clc = require('cli-color');
var fs = require("fs");

function make_logger(level, color, prefix) {
    prefix = prefix || "";
    var transport = conf.logging[level];
    switch (transport) {
        case false:
            return function(){};
        case "stdout":
            return function(message) {
                message = prefix + message;
                if (typeof color === "function") {
                    message = color(message);
                }
                console.log(message);
            };
        case "stderr":
            return function(message) {
                message = prefix + message;
                if (typeof color === "function") {
                    message = color(message);
                }
                console.error(message);
            };
        default:
            return function(message) {
                message = prefix + message;
                fs.appendFile(transport, message + "\n", function(){});
            };
    }
}

module.exports = {
    access: make_logger("access", null),
    debug: make_logger("debug", clc.blue, "[DEBUG] "),
    error: make_logger("error", clc.red, "[ERROR] ")
};

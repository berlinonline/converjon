/* jshint globalstrict: true */
/* global require */
/* global module */
/* global process */
/* global console */

"use strict";
var clc = require("cli-color");
var info = require("../info")();
var conf = require("../config").get();
var child_process = require("../process");
var logging = require("../logging");

function check_imagemagick() {
    return child_process("convert", ["-version"]);
}

function check_exiftool() {
    return child_process("exiftool", ["-ver"]);
}

module.exports = function(cb) {

    check_imagemagick().
    then(function(){
        return check_exiftool();
    }).
    then(function(){
        //log the instance name
        logging.info("Starting up as " + info.instance_name);
        cb();
    }, function(message) {
        logging.error(message);
        console.error("Startup check failed. Aborting ...");
        process.exit(1);
    });
};

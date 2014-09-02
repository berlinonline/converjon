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
        console.log(clc.green("Starting up as " + info.instance_name));
        cb();
        console.log("Running on port " + conf.server.port);
    }, function(message) {
        console.log(message);
        console.log("Startup check failed. Aborting ...");
        process.exit(1);
    });
};

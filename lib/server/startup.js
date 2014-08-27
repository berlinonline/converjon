/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
/* global console */

"use strict";
var clc = require("cli-color");
var info = require("../info")();
var conf = require("../config").get();

//log the instance name
console.log(clc.green("Starting up as " + info.instance_name));
console.log("Running on port " + conf.server.port);


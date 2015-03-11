/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
/* global process */
"use strict";

var config = require("../lib/config");
var pathutils = require("../lib/pathutils");

var config_files = [
    pathutils.join([__dirname, "..", "config", "default.yml"])
];

config.load(config_files);

var logging = require("../lib/logging");

logging.debug("DEBUG!");
logging.access("ACCESS!");
logging.error("ERROR!");


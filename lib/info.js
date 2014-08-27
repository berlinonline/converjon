/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
/* global process */
"use strict";

var pathutils = require("./pathutils");
var fs = require("fs");
var config = require("./config");

var Moniker = require("moniker");
var instance_name = config.get().instance_name || Moniker.generator([Moniker.adjective, Moniker.noun]).choose();

var info_json = fs.readFileSync(
    fs.realpathSync(
        pathutils.join([
            __dirname,
            "..",
            "package.json"
        ])
    )
);

var info = JSON.parse(info_json);

module.exports = function() {
    return {
        version: info.version,
        name: info.name,
        instance_name: instance_name
    };
};

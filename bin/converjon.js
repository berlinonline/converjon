/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
/* global process */
"use strict";

var fs = require("fs");
var config = require("../lib/config");
var pathutils = require("../lib/pathutils");
var Handlebars = require("Handlebars");

var config_files = [
    pathutils.join([__dirname, "..", "config", "default.yml"])
];

var args = require("../lib/cli/args")({
});

var get_info = require("../lib/info");
var info = get_info();

function help() {
    var template_path = fs.realpathSync(pathutils.join([
        __dirname,
        "..",
        "resources",
        "server-help.txt"
    ]));
    var source = fs.readFileSync(template_path).toString("utf-8");
    var template = Handlebars.compile(source);

    return template(info);
}

if (args.help) {
    process.stdout.write(help());
    process.exit();
}

if (args.config) {
    config_files = config_files.concat(args.config);
}

config.load(config_files);

require("../lib/server");

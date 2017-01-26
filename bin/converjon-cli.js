#!/usr/bin/env node

/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
/* global process */
/* global console */
"use strict";

var fs = require("fs");
var pathutils = require("../lib/pathutils");
var config = require("../lib/config");
var Handlebars = require("handlebars");
var rsvp = require("rsvp");
var Promise = rsvp.Promise;


function help() {
    var template_path = fs.realpathSync(pathutils.join([
        __dirname,
        "..",
        "resources",
        "cli-help.txt"
    ]));
    var source = fs.readFileSync(template_path).toString("utf-8");
    var template = Handlebars.compile(source);

    return template(info);
}

function usage() {
    var template_path = fs.realpathSync(pathutils.join([
        __dirname,
        "..",
        "resources",
        "cli-usage.txt"
    ]));
    var source = fs.readFileSync(template_path).toString("utf-8");
    var template = Handlebars.compile(source);

    return template(info);
}

var config_files = [
    pathutils.join([__dirname, "..", "config", "default.yml"])
];

var args = require("../lib/cli/args")({
    alias: {
        w: "width",
        h: "height",
        f: "format",
        m: "mime",
        q: "quality",
        c: "colors"
    },
    string: [
        "aoi",
        "crop",
        "format",
        "interlace"
    ]
});


if (args.config) {
    config_files = config_files.concat(args.config);
}

config.load(config_files);
var processing = require("../lib/processing");
var get_info = require("../lib/info");
var info = get_info();

if (args.help) {
    process.stdout.write(help());
    process.exit();
}

if (args._.length < 2) {
    process.stdout.write(usage());
    process.exit(1);
}

var logging = require("../lib/logging");
var lock = require("../lib/lock").lock;
var analyze = require("../lib/analyze");

var infile = args._[0];
var outfile = args._[1];
var conf = config.get();

var locks;
var report;

rsvp.hash({
    source: lock(infile),
    target: lock(outfile)
}).then(function(l) {
    locks = l;
    return analyze(locks.source, conf);
}).then(function(report) {
    var item = {
        id: 0,
        locks: locks,
        meta_data: {
            analysis: report
        },
        options: args,
        conf: conf
    };
    return processing.create_target_file(item);
}).then(function(){
    process.exit(0);
}, function(error){
    logging.error(error.message);
    process.exit(1);
});

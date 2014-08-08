/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
"use strict";

var fs = require("fs");

var pathutils = require("./pathutils");
var config = require("./config");
var lock = require("./lock");

var rsvp = require("rsvp");
var Promise = rsvp.Promise;


function cache_item_valid(meta) {
    var now = new Date();
    var item_date = Date.parse(meta.date);

}

function get_cache_item(url, options) {
    var conf = config.get(url);
    var dir_path = pathutils.join([
        conf.cache.base_path,
        pathutils.getHashPath(url),
    ]);

    var source_path = pathutils.join([dir_path, "source"]);
    var meta_path = pathutils.join([dir_path, "meta"]);
    var target_path = pathutils.join([dir_path, pathutils.getOptionsPath(options)]);

    var meta_promise = new Promise(function(resolve, reject) {
        lock(meta_path).then(function(meta_lock){
            fs.readFile(meta_lock.key, function(err, data) {
                var meta_data;
                if (err) {
                    reject(err);
                } else {
                    meta_data = JSON.parse(data.toString("utf-8"));
                    if (cache_item_valid(meta_data)) {
                        resolve(meta_data);
                    } else {
                        reject(meta_data);
                    }
                }
            });
        });
    });

}

module.exports = get_cache_item;

/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";
var convert = require("./convert");
var Promise = require("rsvp").Promise;
var cropping = require("./cropping");

function set_default_options(item) {
    var options = item.options;
    var analysis = item.meta_data.analysis;

    options.format = options.format || analysis.format;
    options.crop = options.crop || item.conf.cropping.default_mode;
}

function add_cropping(item) {
    var options = item.options;
    var analysis = item.meta_data.analysis;
    var crop;
    var aoi;

    if (typeof options.aoi !== "undefined") {
        aoi = options.aoi.split(",").map(function(n) {
            return parseInt(n, 10);
        });
        aoi = {x: aoi[0], y: aoi[1], w: aoi[2], h: aoi[3]} || analysis.aoi;
    }

    if (typeof analysis.aoi === "undefined") {
        item.options.crop = "centered";
    }

    if (typeof options.width !== "undefined" && typeof options.height !== "undefined") {
        crop = cropping({
            source: {
                w: analysis.width,
                h: analysis.height,
                aoi: aoi
            },
            mode: item.options.crop,
            target: {
                w: options.width,
                h: options.height
            }
        });

        //console.log(crop);

        item.options.crop_rect = [crop.x, crop.y, crop.w, crop.h];
        item.options.padding = crop.padding;
    }

    //console.log(item);
}

function create_target_file(item) {
    set_default_options(item);
    add_cropping(item);
    var promise = new Promise(function(resolve, reject) {
        convert(
            item.locks.source,
            item.locks.target,
            item.options,
            item.conf
        ).then(function(target_path) {
            resolve(item);
        }, function(err) {
            item.error = err;
            reject(item);
        });
    });

    return promise;
}

module.exports = {
    create_target_file: create_target_file
};

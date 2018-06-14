/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
"use strict";

var rsvp = require("rsvp");
var Promise = rsvp.Promise;

var process = require("./process");
var fsutils = require("./fsutils");
var Cropping = require('./cropping.js');
var stats = require("./stats");
var logging = require("./logging");

function conversion_error(err) {
    err.name = "ConversionError";
    return err;
}

var active_list = {};

var format_map = {
    "jpeg": "jpg",
    "jpg": "jpg",
    "png": "png",
    "gif": "gif"
};

function getImageMagickFormat(format) {
    if (!(format in format_map)) {
        throw conversion_error(new Error('Unconvertible format: ' + format));
    }

    return format_map[format];
}

function formatCropRect(cropRect) {
     return cropRect[2]+'x'+cropRect[3]+'+'+cropRect[0]+'+'+cropRect[1];
}

/**
 * builds an argument array ready to be passed to an imagemagick convert process.
 * @param {string} path to the source file to be converted
 * @param {string} path to where output file wll be written
 *
 * @return array
 */
function getConvertArgs(source_path, target_path, options, config) {
    var args = [];
    var to = getImageMagickFormat(options.format);

    args.push(source_path);

    // support progressive JPGs, PNGs and GIFs
    if (options.interlace) {
        if (options.interlace === "plane") {
            args.push("-interlace", "Plane");
        } else if (options.interlace === "line") {
            args.push("-interlace", "Line");
        } else if (options.interlace === "none") {
            args.push("-interlace", "None");
        } else {
            // type "Partition" is unsupported as it writes mutiple files
            throw conversion_error(
                new Error("Interlace types supported are: plane, line or none.")
            );
        }
    }

    if (options.width && options.height) {
        if (options.crop_rect) {
            args.push("-crop", formatCropRect(options.crop_rect));
        }
    }

    if (options.padding) {
        args.push("-bordercolor", options.padding_color ? options.padding_color : config.converter.padding_color);
        args.push("-border", options.padding.x + "x" + options.padding.y);
    }

    if (config.converter.filter) {
        args.push("-filter", config.converter.filter);
    }

    if (options.width && options.height) {
        args.push("-resize", options.width+"x"+options.height+"!");
    } else if (options.width) {
        args.push("-resize", options.width);
    } else if (options.height) {
        args.push("-resize", "x"+options.height);
    }

    if (options.quality && to == "jpg") {
        args.push("-quality", options.quality+"%");
    } else if (to == "jpg" && config.converter.quality) {
        args.push("-quality", config.converter.quality+"%");
    }

    if (options.colors && to == "gif") {
        args.push("-colors", options.colors);
    }

    if (to == "gif") {
        args.push("+repage");
    }

    if (options.strip_metadata) {
        args.push("-strip");
    }

    if (options.blur) {
        args.push("-blur", "0x"+options.blur);
    }

    args.push(to+":"+target_path);

    return args;
}

function convert(source_path, target_path, options, config) {

    function removeFromActiveList() {
        if (target_path in active_list) {
            delete active_list[target_path];
        }
    }

    var promise = fsutils.mkdirForFile(target_path).then(function(dir_path) {
        return new Promise(function(resolve, reject) {
            var convert_args;

            try {
                convert_args = getConvertArgs(source_path, target_path, options, config);
            } catch (e) {
                reject(e);
            }

            process("convert", convert_args).then(
                function(result) {
                    stats.conversion_success();
                    resolve(target_path);
                },
                function(result) {
                    logging.error(result.stderr);
                    stats.conversion_failure();
                    reject(conversion_error(new Error("Conversion failed")));
                }
            );
        });
    });

    promise.then(removeFromActiveList, removeFromActiveList);

    return promise;
}

module.exports = function(source_lock, target_lock, options, config) {
    var source_path = source_lock.key;
    var target_path = target_lock.key;
    /*
     * if there's already an unresolved promise for this url, return that one
     * instead of starting a second download of source files
     */
    if (!(target_path in active_list)) {
        active_list[target_path] = convert(source_path, target_path, options, config);
    }

    return active_list[target_path];
};

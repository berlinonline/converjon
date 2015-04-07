/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";
var convert = require("./convert");
var Promise = require("rsvp").Promise;
var cropping = require("./cropping");
var logging = require("./logging");

function set_default_options(item) {
    var options = item.options;
    var analysis = item.meta_data.analysis;

    options.format = options.format || analysis.format;
    options.crop = options.crop || item.conf.cropping.default_mode;
    options.strip_metadata = (typeof options.strip_metadata !== "undefined"); //ensure this is a boolean
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
        aoi = {x: aoi[0], y: aoi[1], w: aoi[2], h: aoi[3]};
    } else {
        aoi = analysis.aoi;
    }

    if (!aoi) {
        item.options.crop = "centered";
    } else {
        check_aoi(analysis.width, analysis.height, aoi);
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

        item.options.crop_rect = [crop.x, crop.y, crop.w, crop.h];
        item.options.padding = crop.padding;
    }
}

function check_aoi(w, h, aoi) {
    var valid = true;

    valid = valid && (aoi.x >= 0);
    valid = valid && (aoi.y >= 0);
    valid = valid && (aoi.w > 0);
    valid = valid && (aoi.h > 0);
    valid = valid && (aoi.x + aoi.w <= w);
    valid = valid && (aoi.y + aoi.h <= h);

    if (!valid) {
        throw new AoiError(w, h, aoi);
    }
}

function AoiError(w, h, aoi) {
    this.message = "Area of interest is out of bounds. ";
    this.message += "["+aoi.x+","+aoi.y+","+aoi.w+","+aoi.h+"] ";
    this.message += "does not fit inside ["+w+","+h+"].";
    this.name = "AoiError";
}

function ConstraintError(option, value, c) {
    this.message = "Option '"+option+"' is violating constraints. (min="+c.min+", max="+c.max+")";
    this.name = "ConstraintError";
}
ConstraintError.prototype = new Error();

function check_constraints(item) {
    var constraints = item.conf.constraints;
    var options = item.options;
    var i, c, o;

    for (i in  item.options) {
        if (options.hasOwnProperty(i) && constraints.hasOwnProperty(i)) {
            c = constraints[i];
            o = options[i];

            if (typeof c.min !== "undefined") {
                if (o < c.min) {
                    throw new ConstraintError(i, o, c);
                }
            }

            if (typeof c.max !== "undefined") {
                if (o > c.max) {
                    throw new ConstraintError(i, o, c);
                }
            }
        }
    }
}

function create_target_file(item) {
    set_default_options(item);
    var promise = new Promise(function(resolve, reject) {
        logging.debug(item.id, "Applying cropping and constriants");
        try {
            add_cropping(item);
            check_constraints(item);
        } catch (err) {
            item.error = err;
            reject(item);
            return;
        }

        logging.debug(item.id, "Requesting image conversion");
        convert(
            item.locks.source,
            item.locks.target,
            item.options,
            item.conf
        ).then(function(target_path) {
            logging.debug(item.id, "Image conversion successful");
            resolve(item);
        }, function(err) {
            logging.debug(item.id, "Image conversion failed");
            item.error = err;
            reject(item);
        });
    });

    return promise;
}

module.exports = {
    create_target_file: create_target_file,
    set_default_options: set_default_options,
    check_aoi: check_aoi
};

/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";
var convert = require("./convert");
var Promise = require("rsvp").Promise;
var cropping = require("./cropping");
var logging = require("./logging");
var merge = require("./merge");

function set_default_options(item) {
    var options = item.options;
    var analysis = item.meta_data.analysis;

    options.format = options.format || analysis.format;
    options.crop = options.crop || item.conf.cropping.default_mode;
    options.prefer_embedded_aoi = options.prefer_embedded_aoi || item.conf.prefer_embedded_aoi;
    options.strip_metadata = (typeof options.strip_metadata !== "undefined"); //ensure this is a boolean
}

function extract_preset_data(item) {
    var options = item.options;

    if (typeof options.preset !== "undefined") {

        if (typeof item.conf.presets[options.preset] === "undefined") {
            throw new PresetError(options.preset);
        } else {
             item.options = merge(options, item.conf.presets[options.preset]);
        }
    }
}

function create_aoi(w, h, aoi, defaults) {
    if (!aoi) {
        return;
    }

    defaults = defaults || {};

    var parts = aoi.split(",");
    if (parts.length !== 4) {
        throw new AoiFormatError(aoi);
    }
    var temp = [
        [w, parts[0]],
        [h, parts[1]],
        [w, parts[2]],
        [h, parts[3]]
    ].map(function(tuple) {
        var parsed;
        var ref = tuple[0];
        var value = tuple[1];
        if (value.substr(-1) === '%') {
            parsed = parseFloat(value, 10);
            if (parsed.toString() === "NaN") {
                throw new AoiFormatError(aoi);
            }
            return Math.round(parsed * ref / 100, 0);
        } else {
            parsed = parseInt(value, 10);
            if (parsed.toString() === "NaN") {
                throw new AoiFormatError(aoi);
            }
            return parsed;
        }
    });

    var aoi = {
        x: temp[0],
        y: temp[1],
        w: temp[2],
        h: temp[3]
    };

    Object.keys(defaults).forEach(function(i) {
        aoi[i] = defaults[i];
    })

    return aoi;
}


function add_cropping(item) {
    var options = item.options;
    var analysis = item.meta_data.analysis;
    var crop;
    var aoi;
    var aoi_source = "analysis";

    if (!options.prefer_embedded_aoi) {
      aoi = create_aoi(analysis.width, analysis.height, options.aoi, {source: "options"});
    }

    aoi = aoi || create_aoi(analysis.width, analysis.height, analysis.aoi, {source: "analysis"});

    if (!aoi) {
        item.options.crop = "centered";
    } else {
        try {
            check_aoi(analysis.width, analysis.height, aoi);
        } catch (e) {
            if (e.name === "AoiError" && aoi.source === "analysis") {
                item.options.crop = "centered";
            } else {
                throw e;
            }
        }
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

function AoiFormatError(aoi) {
    this.message = "Area of interest has the wrong format: '" + aoi + "'. ";
    this.name = "AoiFormatError";
}

function ConstraintError(option, value, c) {
    this.message = "Option '"+option+"' is violating constraints. (min="+c.min+", max="+c.max+", type="+c.type+")";
    this.name = "ConstraintError";
}
ConstraintError.prototype = new Error();

function ColorFormatError(color) {
    this.message = color+" is not in a valid HTML color format.";
    this.name = "ColorFormatError";
}
ColorFormatError.prototype = new Error();


function PresetError(preset) {
    this.message = preset+" is not in a valid preset parameter.";
    this.name = "PresetError";
}
PresetError.prototype = new Error();


function check_constraints(item) {
    var constraints = item.conf.constraints;
    var options = item.options;
    var i, c, o;

    for (i in  item.options) {
        if (typeof options[i] !== "undefined" && typeof constraints[i] !== "undefined") {
            c = constraints[i];
            o = options[i];

            if (typeof c.type !== "undefined") {
                if (c.type === "integer") {
                    if (o.toString() !== parseInt(o, 10).toString()) {
                        throw new ConstraintError(i, o, c);
                    }
                }

                if (c.type === "float") {
                    if (o.toString() !== parseFloat(o, 10).toString()) {
                        throw new ConstraintError(i, o, c);
                    }
                }
            }

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

function check_padding_color(item) {
    var options = item.options;

    if (typeof options.padding_color !== "undefined") {
        if (!/^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/.test(options.padding_color)) {
            throw new ColorFormatError(options.padding_color);
        }
    }
}

function create_target_file(item) {
    set_default_options(item);
    var promise = new Promise(function(resolve, reject) {
        logging.debug(item.id, "Applying cropping and constraints");
        try {
            extract_preset_data(item);
            add_cropping(item);
            check_constraints(item);
            check_padding_color(item);
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
    check_aoi: check_aoi,
    create_aoi: create_aoi,
    check_padding_color: check_padding_color
};

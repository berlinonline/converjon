/* jshint globalstrict: true */
/* global module */
"use strict";

/*
 * All cropping functions expect input as an `options` object of the following form:
 *
 *   {
 *     source: {
 *       w: <Number> (width),
 *       h: <Number> (height),
 *       aoi: {
 *         x: <Number> (x-offset),
 *         y: <Number> (y-offset),
 *         w: <Number> (width),
 *         h: <Number> (height)
 *       }
 *     },
 *     mode: "centered" | "aoi_coverage" | "aoi_emphasis" | "aoi_auto"
 *     target: {
 *       w: <Number> (width),
 *       h: <Number> (height)
 *     }
 *   }
 *
 */

var abs = Math.abs;

/*
 * determines the greatest common divisor using Euklids algorithm
 */
var gcd = function (x, y) {
    if(isNaN(x) || isNaN(y)) {
        throw new Error();
    }

    while (y !== 0) {
        var z = x % y;
        x = y;
        y = z;
    }

    return x;
};

/*
 * makes a string like "16/9" or "4/3" from any width/height combination
 *
 * combinations with the same ratio will return the same string
 */
function getRatioString(width, height) {
    var d = gcd(width, height);
    var ratio = Math.floor(width/d) + '/' + Math.floor(height/d);
    return ratio;
}

function new_crop_rect() {
    return {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        padding : {
            x: 0,
            y: 0
        }
    };
}

function floor_crop_rect(crop) {
    return {
        w: Math.floor(crop.w),
        h: Math.floor(crop.h),
        x: Math.floor(crop.x),
        y: Math.floor(crop.y),
        padding: {
            x: Math.floor(crop.padding.x),
            y: Math.floor(crop.padding.y)
        }
    };
}

function add_padding(w,h, crop) {
    if (crop.w > w) {
        crop.padding.x = (crop.w - w) / 2;
        crop.padding.y = 0;
        crop.w = w;
    } else if (crop.h > h) {
        crop.padding.y = (crop.h - h) / 2;
        crop.padding.x = 0;
        crop.h = h;
    } else {
        //nothing to do here
    }
}

function move_inside(w, h, crop) {
    var left, right, top, bottom, mx, my;

    if (crop.x < 0 || crop.x + crop.w > w) {
        left = -crop.x;
        right = crop.x + crop.w - w;

        mx = abs(left) < abs(right) ? left : -right;
        crop.x = crop.x + mx;
    }

    if (crop.y < 0 || crop.y + crop.h > h) {
        top = -crop.y;
        bottom = crop.y + crop.h - h;

        my = abs(top) < abs(bottom) ? top : -bottom;
        crop.y = crop.y + my;
    }
}

/*
 * preserves all of the source image and applies padding if necessary
 */
function crop_none(options) {
    var w = options.source.w;
    var h = options.source.h;

    //set the AOI to the full image
    options.source.aoi = {
        x: 0,
        y: 0,
        w: options.source.w,
        h: options.source.h
    };

    //the use one of the AOI modes, doesn't matter which one.
    return crop_aoi_coverage(options);
}

/*
 * places the crop rectangle with maximum possible size in the center
 * of the source area
 */
function crop_centered(options) {
    var w = options.source.w;
    var h = options.source.h;
    var tw = options.target.w;
    var th = options.target.h;
    var crop = new_crop_rect();

    if (tw / th < w / h) {
        crop.w = h * tw / th;
        crop.h = h;
        crop.x = w / 2 - crop.w / 2;
        crop.y = 0;
    } else {
        crop.w = w;
        crop.h = w / (tw / th);
        crop.x = 0;
        crop.y = h / 2 - crop.h / 2;
    }

    return floor_crop_rect(crop);
}

/*
 * crops while preserving the area of interest and including
 * as much as possible from the source area.
 *
 * The cropping area center is placed as close to the AOI center as possible.
 */
function crop_aoi_coverage(options) {
    var w = options.source.w;
    var h = options.source.h;
    var tw = options.target.w;
    var th = options.target.h;
    var ax = options.source.aoi.x;
    var ay = options.source.aoi.y;
    var aw = options.source.aoi.w;
    var ah = options.source.aoi.h;
    var cr; //the crop ratio
    var crop = new_crop_rect();
    var left, right, top, bottom, mx, my;

    /*
     * normalize the AOI values so they make sense
     * and dont extend outside of the source area
     */
    ax = ax < 0 ? 0 : ax;
    ay = ay < 0 ? 0 : ay;
    aw = ax + aw > w ? w - ax : aw;
    ah = ay + ah > h ? h - ay : ah;

    /*
     * Step 1: determine minimum dimensions for the crop area
     * to ensure to fit the AOI in every case
     */
    if (tw / th > aw / ah) {
        // target is wider that the AOI
        crop.h = ah;
        crop.w = ah * (tw / th);
    } else {
        // target is taller that the AOI
        crop.w = aw;
        crop.h = aw / (tw / th);
    }

    // save the crop ration for later
    cr = crop.w / crop.h;

    /*
     * Step 2: determine the maximum size for the crop area to get as much of the image as possible.
     */
    if (crop.w < w && crop.h < h) {
        if (cr > (w / h)) {
            crop.w = w;
            crop.h = w / cr;
        } else {
            crop.h = h;
            crop.w = h * cr;
        }
    }

    /*
     * Step 4: Position the crop rectangle centered on the AOIs center,
     * then (if necessary) move it inside the image area with the smallest possible movement.
     */
    crop.x = ax + aw/2 - crop.w/2;
    crop.y = ay + ah/2 - crop.h/2;

    return floor_crop_rect(crop);
}

function crop_aoi_emphasis(options) {
    var w = options.source.w;
    var h = options.source.h;
    var tw = options.target.w;
    var th = options.target.h;
    var ax = options.source.aoi.x;
    var ay = options.source.aoi.y;
    var aw = options.source.aoi.w;
    var ah = options.source.aoi.h;
    var cr; //the crop ratio
    var crop = new_crop_rect();
    var left, right, top, bottom, mx, my;

    /*
     * normalize the AOI values so they make sense
     * and dont extend outside of the source area
     */
    ax = ax < 0 ? 0 : ax;
    ay = ay < 0 ? 0 : ay;
    aw = ax + aw > w ? w - ax : aw;
    ah = ay + ah > h ? h - ay : ah;

    cr = tw/th;
    /*
     * Step 1: determine the size of the crop area
     * to fit the AOI
     */
    if (cr > aw/ah) {
        //crop area is wider than AOI
        crop.w = ah * cr;
        crop.h = ah;
    } else {
        //crop area is taller than AOI
        crop.w = aw;
        crop.h = aw / cr;
    }

    /*
     * Step 2: Position the crop rectangle centered on the AOIs center,
     */
    crop.x = ax + aw/2 - crop.w/2;
    crop.y = ay + ah/2 - crop.h/2;

    return floor_crop_rect(crop);
}

function crop_aoi_auto(options) {
    var crop = new_crop_rect();
    //calculate the pixel ratio between the target size and the AOI
    var d = (options.source.aoi.w * options.source.aoi.h) / (options.target.w * options.target.h);

    d = 1 - d; //reverse it, so that 0 means "equal to the emnphasis version"

    // limit do to me within [0,1]. anything else doesn't make sense
    d = d > 1 ? 1 : d;
    d = d < 0 ? 0 : d;

    var coverage = crop_aoi_coverage(options);
    var emphasis = crop_aoi_emphasis(options);

    // the actual crop rectangle is something between the coverage and emphasis rectangle
    crop.x = emphasis.x + d * (coverage.x - emphasis.x);
    crop.y = emphasis.y + d * (coverage.y - emphasis.y);
    crop.w = emphasis.w + d * (coverage.w - emphasis.w);
    crop.h = emphasis.h + d * (coverage.h - emphasis.h);

    return floor_crop_rect(crop);
}

function crop(options) {
    var crop_rect;

    switch (options.mode) {
    case crop.none:
            crop_rect = crop_none(options);
            break;
        case crop.aoi_coverage:
            crop_rect = crop_aoi_coverage(options);
            break;
        case crop.aoi_emphasis:
            crop_rect = crop_aoi_emphasis(options);
            break;
        case crop.aoi_auto: 
            crop_rect = crop_aoi_auto(options);
            break;
        default:
            crop_rect = crop_centered(options);
    }

    //add padding if the image needs it
    add_padding(options.source.w, options.source.h, crop_rect);

    //move the crop rectangle back into the source area by the minimal amount possible.
    move_inside(options.source.w, options.source.h, crop_rect);

    return crop_rect;
}

crop.none = "none";
crop.centered = "centered";
crop.aoi_coverage = "aoi_coverage";
crop.aoi_emphasis = "aoi_emphasis";
crop.aoi_auto = "aoi_auto";

module.exports = crop;

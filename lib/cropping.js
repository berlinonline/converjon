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
     * Step 3: Check if the image need padding after cropping and calculate the padding sizes
     */
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

    /*
     * Step 4: Position the crop rectangle centered on the AOIs center,
     * then (if necessary) move it inside the image area with the smallest possible movement.
     */
    crop.x = ax + aw/2 - crop.w/2;
    crop.y = ay + ah/2 - crop.h/2;

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

    return floor_crop_rect(crop);
}


module.exports = {
    crop_centered: crop_centered,
    crop_aoi_coverage: crop_aoi_coverage
};

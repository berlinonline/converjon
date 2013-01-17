//greatest common divisor using Euklids algorithm
var gcd = function (x, y) {
    if(isNaN(y)) {
        throw new Error();
    }

	while (y != 0) {
		var z = x % y;
		x = y;
		y = z;
	}
	return x;
}

var getRatioString = function(width, height) {
    var d = gcd(width, height);
    var ratio = Math.floor(width/d) + '/' + Math.floor(height/d);
    return ratio;
};

var arrayFloor = function(arr) {
    arr.forEach(function(element, index){
        arr[index] = Math.floor(element);
    });

    return arr;
};

var Cropping = function() {

}

Cropping.prototype = {
    isNeeded: function() {
        var sourceRatio = getRatioString(this.width,this.height);
        var targetRatio = getRatioString(this.targetWidth, this.targetHeight);

        return sourceRatio !== targetRatio;
    },
    initialize: function(width, height, targetWidth, targetHeight) {
        this.width = width;
        this.height = height;
        this.targetWidth = targetWidth;
        this.targetHeight = targetHeight;
        
        this.ratio = width/height;
        this.targetRatio = targetWidth/targetHeight;

        this.offsetX = 0;
        this.offsetY = 0;

        this.paddingRequired = false;
        this.paddingX = 0;
        this.paddingY = 0;
    }
};

/**
 * Area of interest cropping
 *
 *
 */

var AoiCropping = function(width, height, targetWidth, targetHeight, aoiRect) {
    this.initialize(width, height, targetWidth, targetHeight);

    aoiRect = arrayFloor(aoiRect);

    this.aoiX = aoiRect[0];
    this.aoiY = aoiRect[1];
    this.aoiWidth = aoiRect[2];
    this.aoiHeight = aoiRect[3];

    this.normalizeAoi();
};

AoiCropping.prototype = new Cropping();

AoiCropping.prototype.normalizeAoi = function() {
    if (this.aoiX < 0) {
        this.aoiX = 0;
    }

    if (this.aoiY < 0) {
        this.aoiY = 0;
    }

    if (this.aoiX + this.aoiWidth > this.width) {
        this.aoiWidth = this.width - this.aoiX;
    }

    if (this.aoiY + this.aoiHeight > this.height) {
        this.aoiHeight = this.height - this.aoiY;
    }
};

AoiCropping.prototype.getCropRect = function() {
    var crop = {
        x: 0,
        y: 0,
        move: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            x: 0,
            y: 0
        },
        width: 0,
        height: 0,
        ratio: 1
    };
    var aoi = {
        x: this.aoiX,
        y: this.aoiY,
        width: this.aoiWidth,
        height: this.aoiHeight
    };
    var target = {
        width: this.targetWidth,
        height: this.targetHeight,
        ratio: this.targetWidth/this.targetHeight
    };
    var image = {
        width: parseInt(this.width),
        height: parseInt(this.height),
        ratio: this.width/this.height
    };

    /**
     * Step 1: determine minimum dimensions for the crop area to ensure to fit the AOI in ever case
     */
    if (target.ratio <= aoi.ratio) {
        //target is wider than the AOI so we can set the height to the AOIs heigth and calculate the width
        crop.height = aoi.height;
        crop.width = crop.height * target.ratio;
    } else {
        //target is higher than the AOI so we can set the width to the AOIs width and calculate the height
        crop.width = aoi.width;
        crop.height = crop.width / target.ratio;
    }

    crop.ratio = crop.width / crop.height;

    /**
     * Step 2: determine the maximum size for the crop area to get as much of the image as possible.
     */
    if (crop.width < image.width && crop.height < image.height) {
        if (crop.ratio > image.ratio) {
            crop.width = image.width;
            crop.height = crop.width / crop.ratio;
        } else {
            crop.height = image.height;
            crop.width = crop.height * crop.ratio;
        }
    }

    /**
     * Step 3: Check if the image need padding after cropping and calculate the padding sizes
     */
    this.paddingRequired = true;
    if (crop.width > image.width) {
        this.paddingX = Math.floor((crop.width - image.width) / 2);
        this.paddingY = 0;
    } else if (crop.height > image.height) {
        this.paddingY = Math.floor((crop.height - image.height) / 2);
        this.paddingX = 0;
    } else {
        this.paddingRequired = false;
    }

    /**
     * Step 4: Position the crop rectangle centered on the AOIs center,
     * then (if necessary) move it inside the image area with the smallest possible movement.
     */
    crop.x = aoi.x + aoi.width/2 - crop.width/2;
    crop.y = aoi.y + aoi.height/2 - crop.height/2;

    if (crop.x < 0 || crop.x + crop.width > image.width) {
        crop.move.left = -crop.x;
        crop.move.right = crop.x + crop.width - image.width;

        crop.move.x = Math.abs(crop.move.left) < Math.abs(crop.move.right) ? crop.move.left : -crop.move.right;
        crop.x = crop.x + crop.move.x;
    }

    if (crop.y < 0 || crop.y + crop.height > image.height) {
        crop.move.top = -crop.y;
        crop.move.bottom = crop.y + crop.height - image.height;

        crop.move.y = Math.abs(crop.move.top) < Math.abs(crop.move.bottom) ? crop.move.top : -crop.move.bottom;
        crop.y = crop.y + crop.move.y;
    }

    return arrayFloor([crop.x, crop.y, crop.width, crop.height]);
};
AoiCropping.prototype.constructor = AoiCropping;




/**
 * Centered Cropping
 *
 */
var CenteredCropping = function(width, height, targetWidth, targetHeight, aoiRect) {
    this.initialize(width, height, targetWidth, targetHeight);
};

CenteredCropping.prototype = new Cropping();
CenteredCropping.prototype.getCropRect = function() {
    var cropRect = new Array(4);
    if (this.targetWidth/this.targetHeight < this.width/this.height) {
        cropRect[3] = this.height;
        cropRect[2] = cropRect[3] * this.targetRatio;
        cropRect[0] = this.width/2 - cropRect[2]/2;
        cropRect[1] = 0;
    } else {
        cropRect[2] = this.width;
        cropRect[3] = cropRect[2] / this.targetRatio;
        cropRect[0] = 0;
        cropRect[1] = this.height/2 - cropRect[3]/2;
    }
    
    return arrayFloor(cropRect);
};

CenteredCropping.prototype.constructor = CenteredCropping;

module.exports = {
    CenteredCropping: CenteredCropping,
    AoiCropping: AoiCropping
};

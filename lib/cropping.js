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
    }
};

/**
 * Area of interest cropping
 *
 *
 */

var AoiCropping = function(width, height, targetWidth, targetHeight, aoiRect) {
    this.initialize(width, height, targetWidth, targetHeight);

    this.cropX = aoiRect[0];
    this.cropY = aoiRect[1];
    this.cropWidth = aoiRect[2];
    this.cropHeight = aoiRect[3];
};

AoiCropping.prototype = new Cropping();
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

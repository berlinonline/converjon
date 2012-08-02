var config = require('config').imageConverter;
var processPool = require('./processPool');
var Cropping = require('./cropping');

var mimeMap = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif"
};

var UnconvertibleError = function(message) {
    this.name = "UnconvertibleError";
    this.message = message;
}
UnconvertibleError.prototype = Error.prototype;

var getImageMagickFormat = function (mime) {
    if (!(mime in mimeMap)) {
        throw new UnconvertibleError('Unconvertible Mimetype: '+mime);
    }

    if (mime === "image/png" && config.imagemagickBuild === "Q8")
    {
        throw new UnconvertibleError("PNG is not supported with ImageMagick Q8");
    }

    return mimeMap[mime];
};

var formatCropRect = function(cropRect) {
     return cropRect[2]+'x'+cropRect[3]+'+'+cropRect[0]+'+'+cropRect[1];
};

var Conversion = function(readyCallback) {
    this.process = null;
    this.options = {};

    var that = this;

    processPool.getFreeWorker('convert', function(worker) {
        that.worker = worker;
        readyCallback(that);
    });
};

Conversion.prototype = {
    initialize: function(toMime, sourceFile, targetFile) {
        this.to = getImageMagickFormat(toMime);

        this.sourceFile = sourceFile;
        this.targetFile = targetFile;
    },

    startProcess: function() {
        this.process = this.worker.run('convert', this.getConvertArgs());
        this.process.stderr.setEncoding('utf8');
        this.process.stderr.on('data', function(data){
        });

        return this.process;
    },

    getConvertArgs: function() {
        var args = [];
        var source = this.sourceFile;
        
        if (this.options.width && this.options.height) {
            //append the cropping region to the input filename,
            //it's much faster and easier on memory that way
            var cropping = this.getCropping();
            if (cropping.isNeeded()) {
                source += "["+formatCropRect(cropping.getCropRect())+"]";
            }
        }

        args.push(source);


        if (this.options.width && this.options.height) {
            args.push("-resize", this.options.width+"x"+this.options.height+"!");
        } else if (this.options.width) {
            args.push("-resize", this.options.width);
        } else if (this.options.height) {
            args.push("-resize", "x"+this.options.height);
        }

        if (this.options.quality && this.to == "jpg") {
            args.push("-quality", this.options.quality+"%");
        }

        args.push(this.to+":"+this.targetFile)

        return args;
    },

    getCropping: function(){
        if (!(config.aoiName in this.metaData.exif)) {
            return new Cropping.CenteredCropping(
                    this.metaData.width,
                    this.metaData.height,
                    this.options.width,
                    this.options.height
                    );
        }

        var aoiRect = this.metaData.exif[config.aoiName].split(',');

        aoiRect.forEach(function(item, index){
            aoiRect[index] = parseInt(item.toString().trim(), 10);
        });

        if (aoiRect.length !== 4) {
            throw new Error('Wrong aoiRect format! ' + aoiRect.toString());
        }

        return new Cropping.AoiCropping(
                this.metaData.width,
                this.metaData.height,
                this.options.width,
                this.options.height,
                aoiRect
                );
    },

    width: function(width) {
        this.options.width = width;
        return this;
    },

    height: function(height) {
        this.options.height = height;
        return this;
    },
    quality: function(quality) {
        this.options.quality = quality;
    },
    metaData: function(metaData) {
        this.metaData = metaData;
    }
};

module.exports = {
    Conversion: Conversion
}

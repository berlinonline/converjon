var processPool = require('./processPool');
var EventEmitter = require('events').EventEmitter;
fs = require('fs');

var mimeMap = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif"
};

var getImageMagickFormat = function (mime) {
    if (!(mime in mimeMap)) {
        throw new Error('Unconvertible Mimetype: '+mime);
    }

    return mimeMap[mime];
};

var Conversion = function(readyCallback) {
    this.process = null;
    this.options = {};

    var that = this;

    processPool.getFreeWorker(function(worker) {
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

        return this.process;
    },

    getConvertArgs: function() {
        var args = [];
        args.push(this.sourceFile);

        if (this.options.width && this.options.height) {
            args.push("-resize", this.options.width+"x"+this.options.height+"!");
        } else if (this.options.width) {
            args.push("-resize", this.options.width);
        } else if (this.options.height) {
            args.push("-resize", "x"+this.options.height);
        }

        if (this.options.quality) {
            args.push("-quality", this.options.quality+"%");
        }

        args.push(this.to+":"+this.targetFile)

        return args;
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
    }

};

module.exports = {
    Conversion: Conversion
}

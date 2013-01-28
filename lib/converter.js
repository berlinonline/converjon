var config = require('config').converter;
var eventDispatcher = require('./eventDispatcher');
var sourceStore = require('./sourceStore');
var fs = require('fs');
var logger = require('./logger.js');
var analyzer = require('./analyzer.js');
var Cropping = require('./cropping.js');
var process = require('./process');

var runningConversions = [];

var mimeMap = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif"
};

var getImageMagickFormat = function (mime) {
    var matches = /[\w-\+]+\/[\w-\+]+/.exec(mime);
    if (!matches) {
        throw new Error("Error while parsing source MIME type.");
    }

    mime = matches[0];

    if (!(mime in mimeMap)) {
        throw new Error('Unconvertible MIME type: '+mime);
    }

    if (mime === "image/png" && config.imagemagickBuild === "Q8")
    {
        throw new Error("PNG is not supported with ImageMagick Q8");
    }

    return mimeMap[mime];
};

var formatCropRect = function(cropRect) {
     return cropRect[2]+'x'+cropRect[3]+'+'+cropRect[0]+'+'+cropRect[1];
};

var getCropping = function(options){
    var aoi;

    if ('aoi' in options.metaData) {
        aoi = options.metaData.aoi;
    } else {
        aoi = aoi;
    }

    if (!aoi) {
        return new Cropping.CenteredCropping(
                options.metaData.width,
                options.metaData.height,
                options.width,
                options.height
                );
    }

    var aoiRect = aoi.split(',');

    aoiRect.forEach(function(item, index){
        aoiRect[index] = parseInt(item.toString().trim(), 10);
    });

    if (aoiRect.length !== 4) {
        throw new Error('Wrong aoiRect format! ' + aoiRect.toString());
    }

    return new Cropping.AoiCropping(
            options.metaData.width,
            options.metaData.height,
            options.width,
            options.height,
            aoiRect
            );
};

/**
 * builds an argument array ready to be passed to an imagemagick convert process.
 * @param sourceFile path to the source file to be converted
 * @param targetFile path to where output file wll be written
 *
 * @return Array
 */
var getConvertArgs = function(sourceFile, targetFile, options) {
    var args = [];
    var source = sourceFile;
    var to = getImageMagickFormat(options.mime);
    var cropping;
    
    args.push(source);

    if (options.width && options.height) {
        //append the cropping region to the input filename,
        //it's much faster and easier on memory that way
        cropping = getCropping(options);
        if (cropping.isNeeded()) {
            args.push('-crop', formatCropRect(cropping.getCropRect()));
        }
    }

    if (cropping && cropping.paddingRequired) {
        args.push("-bordercolor", '"'+config.paddingColor+'"')
        args.push("-border", cropping.paddingX+"x"+cropping.paddingY);
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
    }
    if (options.colors && to == "gif") {
        args.push("-colors", options.colors);
    }

    args.push(to+":"+targetFile);

    return args;
};

module.exports = function(req) {
    if (!req.continueProcessing) {
        logger.debug("Request", req.id, "is marked for non-continuation");
    }

    logger.debug('Request', req.id, 'starting conversion, running conversions: ', runningConversions.length);

    if (runningConversions.indexOf(req.targetStorePath) > -1) //url in already being downloaded
    {
        logger.debug('Request', req.id, 'file is already being converted. waiting for it to finish', req.targetStorePath);
        return;
    }

    runningConversions.push(req.targetStorePath);

    req.sourceEventKey = 'sourceFileReady::' + req.sourceFingerprint;

    var removeFromRunningConversions = function() {
        logger.debug("Request", req.id, "conversion finished", req.targetStorePath);
        runningConversions.splice(runningConversions.indexOf(req.targetStorePath), 1); //remove from running conversion list
    };

    eventDispatcher.once(req.sourceEventKey, function(sourceStorePath) {
        logger.debug("Request", req.id, "source store ready", sourceStorePath);

        req.analysisEventKey = 'analysisReady::' + req.sourceFingerprint;

        eventDispatcher.once(req.analysisEventKey, function(analysis) {
            var options = {
                mime:       req.query.mime,
                width:      req.query.width,
                height:     req.query.height,
                quality:    req.query.quality,
                colors:     req.query.colors,
                quality:    req.query.quality,
                colors:     req.query.colors,
                aoi:        req.query.aoi,
                metaData:   analysis
            };

            try {
                var convertArgs = getConvertArgs(sourceStorePath, req.targetStorePath, options);
            } catch (e) {
                eventDispatcher.emit(req.errorEventKey, 500, e.message);
                return;
            }

            //logger.debug('coverting with arguments:', convertArgs);
            var childProcess = process('convert', convertArgs);
            childProcess.onSuccess(function(data) {
                removeFromRunningConversions();
                eventDispatcher.emit(req.targetEventKey, req.targetStorePath);
            });
            childProcess.onError(function() {
                logger.error("Request", req.id, "Error during image conversion");
                removeFromRunningConversions();
                eventDispatcher.emit(req.errorEventKey, 500, 'Error during image conversion.');
            });

            childProcess.run();
        });

        analyzer(req);
    });

    eventDispatcher.once(req.errorEventKey, removeFromRunningConversions);

    sourceStore(req);
};

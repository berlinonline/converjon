var config = require('config').converter;
var eventDispatcher = require('./eventDispatcher');
var sourceStore = require('./sourceStore');
var fs = require('fs');
var logger = require('./logger.js');
var analyzer = require('./analyzer.js');
var Cropping = require('./cropping.js');
var process = require('./process');
var statEmitter = require('./stats').emitter;

var runningConversions = [];

var mimeMap = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif"
};

var getImageMagickFormat = function (mime) {
    var matches = /[\w\-\+]+\/[\w\-\+]+/.exec(mime);
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
    var aoi = "";

    if ('aoi' in options.metaData) {
        aoi = options.metaData.aoi;
    }

    var aoiRect = aoi.split(',');

    if (aoiRect.length !== 4) {
        return new Cropping.CenteredCropping(
                options.metaData.width,
                options.metaData.height,
                options.width,
                options.height
                );
    }

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
        args.push("-bordercolor", '"'+config.paddingColor+'"');
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
        logger.debug(req, "is marked for non-continuation");
    }

    logger.debug(req, 'starting conversion, running conversions: ', runningConversions.length);

    if (runningConversions.indexOf(req.targetStorePath) > -1) //url in already being downloaded
    {
        logger.debug(req, 'file is already being converted. waiting for it to finish', req.targetStorePath);
        return;
    }

    runningConversions.push(req.targetStorePath);

    req.sourceEventKey = 'sourceFileReady::' + req.sourceFingerprint;

    var removeFromRunningConversions = function() {
        logger.debug(req, "conversion finished", req.targetStorePath);
        runningConversions.splice(runningConversions.indexOf(req.targetStorePath), 1); //remove from running conversion list
    };

    eventDispatcher.once(req.errorEventKey, removeFromRunningConversions);

    eventDispatcher.once(req.sourceEventKey, function(sourceStorePath) {
        logger.debug(req, "source store ready", sourceStorePath);

        req.analysisEventKey = 'analysisReady::' + req.sourceFingerprint;

        eventDispatcher.once(req.analysisEventKey, function(analysis) {
            var convertArgs;
            var options = {
                mime:       req.query.mime,
                width:      req.query.width,
                height:     req.query.height,
                quality:    req.query.quality,
                colors:     req.query.colors,
                aoi:        req.query.aoi,
                metaData:   analysis
            };

            try {
                convertArgs = getConvertArgs(sourceStorePath, req.targetStorePath, options);
            } catch (e) {
                eventDispatcher.emit(req.errorEventKey, 500, e.message);
                statEmitter.emit('Converter::Failed');
                return;
            }

            //logger.debug('coverting with arguments:', convertArgs);
            var childProcess = process.create(req.id, 'convert', convertArgs);
            childProcess.onSuccess(function(data) {
                removeFromRunningConversions();
                eventDispatcher.emit(req.targetEventKey, req.targetStorePath);
                statEmitter.emit('Converter::Success');
            });
            childProcess.onError(function() {
                logger.error(req, "Error during image conversion");
                eventDispatcher.emit(req.errorEventKey, 500, 'Error during image conversion.');
                statEmitter.emit('Converter::Failed');
            });

            childProcess.run();
        });

        analyzer(req);
    });

    sourceStore(req);
};

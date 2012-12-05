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
    
    if (options.width && options.height) {
        //append the cropping region to the input filename,
        //it's much faster and easier on memory that way
        cropping = getCropping(options);
        if (cropping.isNeeded()) {
            source = source + "["+formatCropRect(cropping.getCropRect())+"]";
        }
    }

    args.push(source);

    if (cropping && cropping.paddingRequired) {
        args.push("-bordercolor", config.paddingColor)
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

    args.push(to+":"+targetFile)

    return args;
};

module.exports = function(req) {
    logger.debug('running converters', runningConversions.length);
    if (runningConversions.indexOf(req.targetStorePath) > -1) //url in already being downloaded
    {
        logger.debug('File is already being converted');
        return;
    }

    runningConversions.push(req.targetStorePath);

    req.targetEventKey = 'targetFileReady::' + req.targetFingerprint;

    var removeFromRunningConversions = function() {
        logger.debug('removing from conversions');
        runningConversions.splice(runningConversions.indexOf(req.targetStorePath), 1); //remove from running conversion list
    };

    eventDispatcher.once(req.sourceEventKey, function(sourceStorePath) {

        req.analysisEventKey = 'analysisReady::' + req.sourceFingerprint;

        eventDispatcher.once(req.analysisEventKey, function(analysis) {
            var options = {
                mime:       req.query.mime ? req.query.mime : config.defaultMimeType,
                width:      req.query.width,
                height:     req.query.height,
                quality:    req.query.quality,
                colors:     req.query.colors,
                quality:    req.query.quality,
                colors:     req.query.colors,
                aoi:        req.query.aoi,
                metaData:   analysis
            };

            var convertArgs = getConvertArgs(sourceStorePath, req.targetStorePath, options);

            //logger.debug('coverting with arguments:', convertArgs);
            var childProcess = process('convert', convertArgs);
            childProcess.onSuccess(function(data) {
                removeFromRunningConversions();
                eventDispatcher.emit(req.targetEventKey, req.targetStorePath);
            });
            childProcess.onError(function() {
                removeFromRunningConversions();
                eventDispatcher.emit(req.errorEventKey, 500, 'Error during image conversion.');
            });

            childProcess.run();

            /*var sourceFile = fs.createReadStream(sourceStorePath);
            var targetFile = fs.createWriteStream(req.targetStorePath);

            sourceFile.on('end', function() {
                eventDispatcher.emit(req.targetEventKey, sourceStorePath);
            });

            sourceFile.pipe(targetFile);
            */
        });

        analyzer(req);
    });

    eventDispatcher.once(req.errorEventKey, removeFromRunningConversions);

    sourceStore(req);
};

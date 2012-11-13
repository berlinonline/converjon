var config = require('config').imageFetcher;
var fs = require('fs');
var path = require('path');
var downloadQueue = require('./downloadQueue');
var downloadImage = downloadQueue.downloadImage;
var isInDownloadQueue = downloadQueue.isInDownloadQueue;

var Conversion = require('./imageConverter').Conversion;
var analyze = require('./imageAnalyzer').analyze;

var isFileStale = function(stat, isSourceFile){
    isSourceFile = typeof isSourceFile === "undefined" ? false : isSourceFile;
    var age = getAgeFromStat(stat);

    var cacheTime = isSourceFile ? config.cache.sourceCacheTime : config.cache.outputCacheTime;
    return age > cacheTime;
};

var getAgeFromStat = function(stat) {
    if (!stat) {
        return 0;
    }

    var creationTimestamp = stat.ctime.getTime();
    return (Date.now() - creationTimestamp) / (1000);
}

var makeParentDir = function(filePath, error, success) {
    var parentPath = path.dirname(filePath);
    fs.stat(parentPath, function(err, stat){
        if (!err && stat.isDirectory()) {
            success();
        } else {
            makeParentDir(parentPath, error, function(){
                fs.mkdir(parentPath, 0777, function(err) {
                    if (err && err.code !== "EEXIST") {
                        error(parentPath);
                    } else {
                        success();
                    }
                });
            });
        }
    });
};

var processFiles = function(sourceCachePath, targetCachePath, req, res, next) {
    var targetStat;

    var deliver = function() {
        var remainingCacheTime;
        remainingCacheTime = config.cache.outputCacheTime - getAgeFromStat(targetStat);
        res.setHeader('Expires', new Date(Date.now() + 1000 * remainingCacheTime));
        fs.createReadStream(targetCachePath).pipe(res);
    };

    var dirErrorCallback = function(dir){
        res.statusCode = 500;
        res.end('Could not create directory '+dir);
    };

    fs.stat(targetCachePath, function(err, stat) {
        targetStat = stat;
        if (stat && !isFileStale(stat)) {
            //just deliver the file without doing anything.
            deliver();
        } else {
            makeParentDir(targetCachePath, dirErrorCallback, function(){
                var conversion = new Conversion(function(conversion){
                    conversion.worker.on('destroy', function(){
                        res.statusCode 0 500;
                        res.end('Image processing timed out.');
                    });
                    var convert = function() {
                        analyze(sourceCachePath, function(){
                            res.statusCode = 502;
                            res.end('Error while reading image metadata.');
                            conversion.worker.free();
                        }, function(report){
                            try {
                                conversion.initialize(
                                    req.query.mime,
                                    sourceCachePath,
                                    targetCachePath
                                    );
                                res.setHeader('Content-Type', req.query.mime);
                                conversion.setWidth(req.query.width).setHeight(req.query.height);
                                conversion.setQuality(req.query.quality);
                                conversion.setColors(req.query.colors);
                                conversion.setAoi(req.query.aoi);
                                conversion.setMetaData(report);

                                var process = conversion.startProcess();
                                process.on('exit', deliver);
                            } catch (e) {
                                if (e.name && e.name === "UnconvertibleError") {
                                    res.statusCode = 422;
                                    res.end(e.message);
                                } else {
                                    res.statusCode = 500;
                                    res.end(e.message);
                                }
                                conversion.worker.free();
                            }
                            return;
                        });
                    };


                    fs.stat(sourceCachePath, function(err, stat) {
                        if(stat && !isFileStale(stat) && !isInDownloadQueue(req.query.url)) {
                            convert();
                        } else {
                            makeParentDir(sourceCachePath, dirErrorCallback, function(){
                                downloadImage(
                                    req.query.url,
                                    sourceCachePath,
                                    convert,
                                    function(code, message){
                                        res.statusCode = code;
                                        res.end(message);

                                        conversion.worker.free();
                                        return;
                                    }
                                );
                            });
                        }
                    });
                });
            });
        }
    });
};

module.exports = function(options){
    
    return function(req, res, next) {
        req.query.mime = req.query.mime || config.defaultOutputMime;

        var sourceCachePath = config.cache.sourceBasePath + req.sourceFingerprint;
        var targetCachePath = config.cache.targetBasePath + req.fingerprint;

        processFiles(sourceCachePath, targetCachePath, req, res, next);
    };
};


var config = require('config').imageFetcher;
var fs = require('fs');
var path = require('path');
var downloadImage = require('./downloadQueue');

var Conversion = require('./imageConverter').Conversion;
var analyze = require('./imageAnalyzer').analyze;

var isFileStale = function(stat, isSourceFile){
    isSourceFile = typeof isSourceFile === "undefined" ? false : isSourceFile;
    var creationTimestamp = stat.ctime.getTime();
    var age = (Date.now() - creationTimestamp) / (1000);

    var cacheTime = isSourceFile ? config.cache.sourceCacheTime : config.cache.outputCacheTime;
    return age > cacheTime;
};

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
    var deliver = function() {
        fs.createReadStream(targetCachePath).pipe(res);
    };

    var dirErrorCallback = function(dir){
        res.statusCode = 500;
        res.end('Could not create directory '+dir);
    };

    fs.stat(targetCachePath, function(err, stat) {
        if (stat && !isFileStale(stat)) {
            //just deliver the file without doing anything.
            deliver();
        } else {
            makeParentDir(targetCachePath, dirErrorCallback, function(){
                var conversion = new Conversion(function(conversion){
                    var convert = function() {
                        analyze(sourceCachePath, function(){
                            res.statusCode = 502;
                            res.end('Error while reading image metadata.');
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
                            }
                            return;
                        });
                    };


                    fs.stat(sourceCachePath, function(err, stat) {
                        if(stat && !isFileStale(stat)) {
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


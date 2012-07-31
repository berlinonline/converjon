var config = require('config').imageFetcher;
var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');

var Conversion = require('./imageConverter').Conversion;

var isFileState = function(name, stat){
    var creationTimestamp = stat.ctime.getTime();
    var age = (Date.now() - creationTimestamp) / (1000);

    return age > config.cache.cacheTime;
};

module.exports = function(options){
    
    return function(req, res, next) {
        rcv = snd = 0;
        var i, whitelist, urlAllowed = false;

        if (!req.query.url) {
            res.statusCode = 400;
            res.write('Image URL parameter is missing', 'utf8');
            res.end();
            return;
        }

        req.query.mime = req.query.mime || config.defaultOutputMime;

        var requestOptions = url.parse(req.query.url);
        var targetCachePath = config.cache.basePath + req.fingerprint;
        var sourceCachePath = config.cache.basePath + req.sourceFingerprint;

        var deliver = function() {
            fs.createReadStream(targetCachePath).pipe(res);
        };

        fs.stat(targetCachePath, function(err, stat) {
            if (stat && !isFileState(targetCachePath, stat)) {
                //just deliver the file without doing anything.
                res.statusCode = 
                deliver();
            } else {
                var conversion = new Conversion(function(conversion){
                    http.request(requestOptions, function(imageResponse) {
                        if (config.acceptedContentTypes.indexOf(imageResponse.headers['content-type']) < 0) {
                            res.statusCode = 422;
                            res.write('Content type of this URL target is not acceptable.');
                            res.end();
                            return;
                        }

                        imageResponse.pipe(fs.createWriteStream(sourceCachePath));
                        imageResponse.on('end', function(){
                            conversion.initialize(
                                req.query.mime,
                                sourceCachePath,
                                targetCachePath
                                );
                            res.setHeader('Content-Type', req.query.mime);
                            conversion.width(req.query.width).height(req.query.height);
                            var process = conversion.startProcess();
                            process.on('exit', deliver);
                        });

                    }).end();
                });
            }
        });
    };
};


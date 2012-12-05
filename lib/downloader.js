var http = require('http');
var url = require('url');
var config = require('config').downloader;
var fs = require('fs');
var eventDispatcher = require('./eventDispatcher');
var fsUtils = require('./fsUtils.js');
var mv = require('mv');
var logger = require('./logger.js');

var activeDownloads = [];

module.exports = function(req) {
    var sourceUrl = req.query.url;
    logger.debug('Request', req.id, 'downloading source file', sourceUrl);
    var downloadPath = config.tempPath + req.sourceFingerprint;
    
    fsUtils.makeParentDirRecursive(downloadPath, function() {
        if (activeDownloads.indexOf(sourceUrl) > -1) //url in already being downloaded
        {
            logger.debug('Request', req.id, 'file is already being downloaded. waiting for it to finish', sourceUrl);
            return;
        }

        activeDownloads.push(sourceUrl);

        var removeFromActiveDownloads = function() {
            activeDownloads.splice(activeDownloads.indexOf(sourceUrl), 1); //remove from active download list
        };

        http.request(url.parse(sourceUrl), function(response) {
            logger.debug('Request', req.id, 'receiving download response');
            var mime;

            if (response.statusCode != 200) {
                eventDispatcher.emit(req.errorEventKey, 502, 'Could not download source file');
                logger.error('Request', req.id, 'download error', response.statusCode, sourceUrl);
                return;
            }

            var matches = /[\w-\+]+\/[\w-\+]+/.exec(response.headers['content-type']);
            if (!matches) {
                eventDispatcher.emit(req.errorEventKey, 422, 'Content type of this URL target can not be parsed.');
                logger.error('Request', req.id, 'invalid source content type', response.headers['content-type']);
                return;
            }

            mime = matches[0];

            if (config.acceptedContentTypes.indexOf(mime) < 0) {
                eventDispatcher.emit(req.errorEventKey, 422, 'Content type of this URL target is not acceptable.');
                logger.error('Request', req.id, 'source content type not allowed', response.headers['content-type']);
            } else {
                response.on('end', function() {
                    //move the file to the source store
                    mv(downloadPath, req.sourceStorePath, function(error) {
                        if (!error) {
                            removeFromActiveDownloads();
                            eventDispatcher.emit(req.downloadEventKey, req.sourceStorePath);
                        } else {
                            removeFromActiveDownloads();
                            eventDispatcher.emit(req.errorEventKey, 500, 'File operation error');
                            logger.error('Request', req.id, 'moving downloaded file to source store failed');
                        }
                    });
                });

                response.pipe(fs.createWriteStream(downloadPath));
            }
        }).on('error', function(e){
            eventDispatcher.emit(req.errorEventKey, 502, 'Upstream repsonse error');
            logger.error('Request', req.id, 'source request error');
        }).end();
    },
    function(err) {
        eventDispatcher.emit(req.errorEventKey, 502, 'Download directory can\'t be created: ' + downloadPath);
        logger.error('Could not create source store directory', req.sourceStorePath);
    });
};

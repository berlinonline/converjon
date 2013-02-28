var http = require('http');
var https = require('https');
var url = require('url');
var config = require('config').downloader;
var fs = require('fs');
var eventDispatcher = require('./eventDispatcher');
var fsUtils = require('./fsUtils.js');
var mv = require('mv');
var logger = require('./logger.js');
var statEmitter = require('./stats').emitter;

var activeDownloads = [];

module.exports = function(req) {
    var client;

    if (!req.continueProcessing) {
        logger.debug("Request", req.id, "is marked for non-continuation");
    }

    var sourceUrl = req.query.url;
    logger.debug('Request', req.id, 'downloading source file', sourceUrl);
    var downloadPath = config.tempPath + req.sourceFingerprint;
    
    var removeFromActiveDownloads = function() {
        var index = activeDownloads.indexOf(sourceUrl);
        if (index > -1) {
            activeDownloads.splice(activeDownloads.indexOf(sourceUrl), 1); //remove from active download list
        }
    };

    var handleDownloadError = function(code, message) {
        removeFromActiveDownloads();
        eventDispatcher.emit(req.downloadErrorEventKey, {
            code: code,
            message: message
        });
    };

    fsUtils.makeParentDirRecursive(downloadPath, function() {
        if (activeDownloads.indexOf(sourceUrl) > -1) //url in already being downloaded
        {
            logger.debug('Request', req.id, 'file is already being downloaded. waiting for it to finish', sourceUrl);
            return;
        }

        activeDownloads.push(sourceUrl);

        if (/^https:/.test(sourceUrl)) {
            client = https;
        } else {
            client = http;
        }

        client.request(url.parse(sourceUrl), function(response) {
            logger.debug('Request', req.id, 'receiving download response');
            var mime;
            var writeStream;

            if (response.statusCode != 200) {
                logger.error('Request', req.id, 'download error', response.statusCode, sourceUrl);
                handleDownloadError(502, 'Could not download source file');

                statEmitter.emit('Download::Failed');
                return;
            }

            var matches = /[\w\-\+]+\/[\w\-\+]+/.exec(response.headers['content-type']);
            if (!matches) {
                logger.error('Request', req.id, 'invalid source content type', response.headers['content-type']);
                handleDownloadError(422, 'Content type of this URL target can not be parsed.');
                return;
            }

            mime = matches[0];

            if (config.acceptedContentTypes.indexOf(mime) < 0) {
                handleDownloadError(422, 'Content type of this URL target is not acceptable.');
                logger.error('Request', req.id, 'source content type not allowed', response.headers['content-type']);
            } else {
                response.on('end', function() {
                    //move the file to the source store
                    mv(downloadPath, req.sourceStorePath, function(error) {
                        if (!error) {
                            removeFromActiveDownloads();
                            eventDispatcher.emit(req.downloadSuccessEventKey, req.sourceStorePath);

                            statEmitter.emit('Download::Success');
                        } else {
                            logger.error('Request', req.id, 'moving downloaded file to source store failed');
                            handleDownloadError(500, 'File operation error');

                            statEmitter.emit('Download::Failed');
                        }
                    });
                });

                response.on('error', function(){
                    handleDownloadError(500, 'File operation error');
                    statEmitter.emit('Download::Failed');
                });

                writeStream = fs.createWriteStream(downloadPath);
                writeStream.on('error', function(){
                    handleDownloadError(500, 'File operation error');
                    statEmitter.emit('Download::Failed');
                });

                response.pipe(writeStream);
            }
        }).on('error', function(e){
            statEmitter.emit('Download::Failed');
            logger.error('Request', req.id, 'source request error');
            handleDownloadError(502, 'Upstream repsonse error');
        }).end();
    },
    function(err) {
        logger.error('Could not create source store directory', req.sourceStorePath);
        handleDownloadError(502, 'Download directory can\'t be created: ' + downloadPath);
    });
};

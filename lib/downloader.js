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

http.globalAgent.maxSockets = config.maxSockets;

module.exports = function(req) {
    var client;

    if (!req.continueProcessing) {
        logger.debug(req, "Request is marked for non-continuation");
    }

    var sourceUrl = req.query.url;
    logger.debug(req, 'Downloading source file', sourceUrl);
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
            logger.debug(req, 'File is already being downloaded. waiting for it to finish', sourceUrl);
            return;
        }

        activeDownloads.push(sourceUrl);

        if (/^https:/.test(sourceUrl)) {
            client = https;
        } else {
            client = http;
        }

        var download_options = url.parse(sourceUrl);
        download_options.method = "GET";

        var download_request = client.request(download_options);
        download_request.setTimeout(config.timeout);
        download_request.setSocketKeepAlive(false);

        download_request.on('response', function(response) {
            logger.debug(req, 'Receiving download response');
            var mime;
            var writeStream;
            var ok = true;

            if (ok && response.statusCode != 200) {
                logger.error(req, 'Download error', response.statusCode, sourceUrl);
                handleDownloadError(502, 'Could not download source file');

                statEmitter.emit('Download::Failed');
                ok = false;
            }

            var matches = /[\w\-\+]+\/[\w\-\+]+/.exec(response.headers['content-type']);
            if (ok && !matches) {
                logger.error(req, 'Invalid source content type', response.headers['content-type']);
                handleDownloadError(422, 'Content type of this URL target can not be parsed.');
                ok = false;
            }

            if (ok) {
                mime = matches[0];
                if (config.acceptedContentTypes.indexOf(mime) < 0) {
                    handleDownloadError(422, 'Content type of this URL target is not acceptable.');
                    logger.error(req, 'Source content type not allowed', response.headers['content-type']);
                    ok = false;
                }
            }

            if (ok) {
                response.on('end', function() {
                    //move the file to the source store
                    mv(downloadPath, req.sourceStorePath, function(error) {
                        if (!error) {
                            removeFromActiveDownloads();
                            eventDispatcher.emit(req.downloadSuccessEventKey, req.sourceStorePath);

                            statEmitter.emit('Download::Success');
                        } else {
                            logger.error(req, 'Moving downloaded file to source store failed');
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
            } else {
                response.resume();
            }
        });
        download_request.on('error', function(e){
            statEmitter.emit('Download::Failed');
            logger.error(req, 'Source request error');
            handleDownloadError(502, 'Upstream repsonse error');
        });
        download_request.end();
    },
    function(err) {
        logger.error(req, 'Could not create source store directory', req.sourceStorePath);
        handleDownloadError(502, 'Download directory can\'t be created: ' + downloadPath);
    });
};

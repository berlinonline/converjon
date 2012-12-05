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
    logger.debug('downloading: ', sourceUrl);
    var downloadPath = config.tempPath + req.sourceFingerprint;
    
    fsUtils.makeParentDirRecursive(downloadPath, function() {
        if (activeDownloads.indexOf(sourceUrl) > -1) //url in already being downloaded
        {
            logger.debug('File is already being downloaded');
            return;
        }

        activeDownloads.push(sourceUrl);

        var removeFromActiveDownloads = function() {
            activeDownloads.splice(activeDownloads.indexOf(sourceUrl), 1); //remove from active download list
        };

        http.request(url.parse(sourceUrl), function(response) {
            logger.debug('receiving response');
            var mime;

            if (response.statusCode != 200) {
                eventDispatcher.emit(req.errorEventKey, 502, 'Source file not found.');
                return;
            }

            var matches = /[\w-\+]+\/[\w-\+]+/.exec(response.headers['content-type']);
            if (!matches) {
                eventDispatcher.emit(req.errorEventKey, 422, 'Content type of this URL target can not be parsed.');
                return;
            }

            mime = matches[0];

            if (config.acceptedContentTypes.indexOf(mime) < 0) {
                eventDispatcher.emit(req.errorEventKey, 422, 'Content type of this URL target is not acceptable.');
            } else {
                response.on('end', function() {
                    //move the file to the source store
                    mv(downloadPath, req.sourceStorePath, function(error) {
                        if (!error) {
                            removeFromActiveDownloads();
                            eventDispatcher.emit(req.downloadEventKey, req.sourceStorePath);
                        } else {
                            removeFromActiveDownloads();
                            logger.debug(error);
                            eventDispatcher.emit(req.errorEventKey, 500, 'Could not move downloaded file to source store.');
                        }
                    });
                });

                response.pipe(fs.createWriteStream(downloadPath));
            }
        }).on('error', function(e){
            eventDispatcher.emit(req.errorEventKey, 502, 'Upstream repsonse error');
        }).end();
    },
    function(err) {
        eventDispatcher.emit(req.errorEventKey, 502, 'Download directory can\'t be created: ' + downloadPath);
    });
};

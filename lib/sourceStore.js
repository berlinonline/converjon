var config = require('config').sourceStore;
var fs = require('fs');
var send = require('send');
var eventDispatcher = require('./eventDispatcher');
var downloader = require('./downloader.js');
var fsUtils = require('./fsUtils.js');
var logger = require('./logger.js');

module.exports = function(req) {
    if (!req.continueProcessing) {
        logger.debug("Request", req.id, "is marked for non-continuation");
    }

    logger.debug('Request', req.id, 'looking up source store');

    req.sourceStorePath = config.basePath + req.sourceFingerprint;
    req.downloadSuccessEventKey = 'downloadReady::' + req.query.url;
    req.downloadErrorEventKey = 'downloadFailed::' + req.query.url;

    fsUtils.makeParentDirRecursive(req.sourceStorePath, function() {
        fs.stat(req.sourceStorePath, function(err, stat) {
            if (stat) {
                var fileAge = Date.now() - stat.mtime;
                if (fileAge <= config.maxAge * 1000) {
                    logger.debug('Request', req.id, 'source store item is still valid.');
                    eventDispatcher.emit(req.sourceEventKey, req.sourceStorePath);

                    return;
                }
            }

            logger.debug('Request', req.id, 'source store item is stale or non existant.');

            eventDispatcher.once(req.downloadSuccessEventKey, function(sourceStorePath) {
                logger.debug("Request", req.id, "download ready", sourceStorePath);
                eventDispatcher.removeAllListeners(req.downloadErrorEventKey);
                eventDispatcher.emit(req.sourceEventKey, sourceStorePath);
            });

            eventDispatcher.once(req.downloadErrorEventKey, function(error) {
                logger.debug("Request", req.id, "Download reported failure");
                eventDispatcher.removeAllListeners(req.downloadSuccessEventKey);
                eventDispatcher.emit(req.errorEventKey, error.code, error.message);
            });

            downloader(req);
        });
    }, function () {
        eventDispatcher.emit(req.errorEventKey, 500, 'Could not create source store directory');
        logger.error('Request', req.id, 'Could not create source store directory');
    });
};



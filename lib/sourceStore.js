var config = require('config').sourceStore;
var fs = require('fs');
var send = require('send');
var eventDispatcher = require('./eventDispatcher');
var downloader = require('./downloader.js');
var fsUtils = require('./fsUtils.js');
var logger = require('./logger.js');

module.exports = function(req) {
    logger.debug('Request', req.id, 'looking up source store');

    req.sourceStorePath = config.basePath + req.sourceFingerprint;
    req.downloadEventKey = 'downloadReady::' + req.query.url;

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

            eventDispatcher.once(req.downloadEventKey, function(sourceStorePath) {
                logger.debug("Request", req.id, "download ready", sourceStorePath);
                eventDispatcher.emit(req.sourceEventKey, sourceStorePath);
            });

            downloader(req);
        });
    }, function () {
        eventDispatcher.emit(req.errorEventKey, 500, 'Could not create source store directory');
        logger.error('Request', req.id, 'Could not create source store directory');
    });
};



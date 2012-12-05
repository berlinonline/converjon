var config = require('config').sourceStore;
var fs = require('fs');
var send = require('send');
var eventDispatcher = require('./eventDispatcher');
var downloader = require('./downloader.js');
var fsUtils = require('./fsUtils.js');
var logger = require('./logger.js');

module.exports = function(req) {
    req.sourceStorePath = config.basePath + req.sourceFingerprint;
    req.downloadEventKey = 'downloadReady::' + req.query.url;

    fsUtils.makeParentDirRecursive(req.sourceStorePath, function() {
        fs.stat(req.sourceStorePath, function(err, stat) {
            if (stat) {
                var fileAge = Date.now() - stat.mtime;
                if (fileAge <= config.maxAge * 1000) {
                    eventDispatcher.emit(req.sourceEventKey, req.sourceStorePath);

                    return;
                }
            }

            eventDispatcher.once(req.downloadEventKey, function(downloadPath) {
                eventDispatcher.emit(req.sourceEventKey, req.sourceStorePath);
            });

            downloader(req);
        });
    }, function () {
        eventDispatcher.emit(req.errorEventKey, 500, 'Could not create source store directory');
    });
};



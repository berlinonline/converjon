var config = require('config').sourceStore;
var fs = require('fs');
var send = require('send');
var eventDispatcher = require('./eventDispatcher');
var downloader = require('./downloader.js');
var fsUtils = require('./fsUtils.js');
var mv = require('mv');

module.exports = function(req) {

    var sourceStorePath = config.basePath + req.sourceFingerprint;
    req.downloadEventKey = 'downloadReady::' + req.query.url;

    fsUtils.makeParentDirRecursive(sourceStorePath, function() {
        fs.stat(sourceStorePath, function(err, stat) {
            if (stat) {
                var fileAge = Date.now() - stat.mtime;
                if (fileAge <= config.maxAge * 1000) {
                    eventDispatcher.emit(req.sourceEventKey, sourceStorePath);

                    return;
                }
            }

            eventDispatcher.once(req.downloadEventKey, function(downloadPath) {
                console.log('renaming to', sourceStorePath);
                mv(downloadPath, sourceStorePath, function(error) {
                    if (!error) {
                        eventDispatcher.emit(req.sourceEventKey, sourceStorePath);
                    } else {
                        eventDispatcher.emit(req.errorEventKey, 500, 'File handling error');
                    }
                });
            });

            downloader(req);
        });
    }, function () {
        eventDispatcher.emit(req.errorEventKey, 500, 'File handling error');
    });

};



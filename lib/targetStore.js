var config = require('config').targetStore;
var fs = require('fs');
var path = require('path');
var send = require('send');
var eventDispatcher = require('./eventDispatcher');
var converter = require('./converter.js');
var nextRequestId = require('./requestId.js');
var fsUtils = require('./fsUtils.js');

var sendResponseToClient = function(req, res, sendFilePath)
{
    send(req, sendFilePath).pipe(res);
};

module.exports = function(options) {
    
    return function(req, res, next) {
        req.targetStorePath = config.basePath + req.targetFingerprint;

        req.targetEventKey = 'targetFileReady::' + req.fingerprint;
        req.errorEventKey = 'error::' + nextRequestId();

        var respond = function(filePath) {
            sendResponseToClient(req, res, filePath);
        };

        eventDispatcher.once(req.targetEventKey, respond);

        eventDispatcher.once(req.errorEventKey, function(errorCode, errorMessage) {
            // prevent the success callback from firing later, after the error response has already been sent.
            eventDispatcher.removeListener(req.targetEventKey, respond);

            res.statusCode = errorCode;
            res.end(errorMessage);
        });

        fs.stat(req.targetStorePath, function(err, stat) {
            if (stat) {
                var fileAge = Date.now() - stat.mtime;
                if (fileAge <= config.maxAge * 1000) {
                    eventDispatcher.emit(req.targetEventKey, req.targetStorePath);

                    return;
                }
            }

            fsUtils.makeParentDirRecursive(req.targetStorePath, function() {
                converter(req);
            }, function() {
                eventDispatcher.emit(req.errorEventKey, 500, 'File Handling Error');
            });
        });
    };
};


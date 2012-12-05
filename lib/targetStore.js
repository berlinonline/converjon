var config = require('config').targetStore;
var fs = require('fs');
var path = require('path');
var send = require('send');
var eventDispatcher = require('./eventDispatcher');
var converter = require('./converter.js');
var nextRequestId = require('./requestId.js');
var fsUtils = require('./fsUtils.js');
var logger = require('./logger.js');
var mime = require('mime');

var sendResponseToClient = function(req, res, sendFilePath)
{
    send(req, sendFilePath).pipe(res);
};

module.exports = function(options) {
    
    return function(req, res, next) {
        req.id = nextRequestId();
        
        req.targetStorePath = config.basePath + req.targetFingerprint + '.' + mime.extension(req.query.mime);

        logger.debug('Request', req.id, 'looking up target store', req.targetStorePath);

        req.targetEventKey = 'targetFileReady::' + req.targetFingerprint;
        req.errorEventKey = 'error::' + req.id;

        var respond = function(filePath) {
            logger.debug('Request', req.id, 'delivering from target store', filePath);
            //remove error event since it is no longer needed
            eventDispatcher.removeAllListeners(req.errorEventKey);
            clearTimeout(clientRequestTimeout);
            sendResponseToClient(req, res, filePath);
        };

        eventDispatcher.once(req.targetEventKey, respond);

        eventDispatcher.once(req.errorEventKey, function(errorCode, errorMessage) {
            // prevent the other callbacks from firing later, after the error response has already been sent.
            clearTimeout(clientRequestTimeout);
            eventDispatcher.removeListener(req.targetEventKey, respond);

            res.statusCode = errorCode;
            res.end(errorMessage);
        });

        var clientRequestTimeout = setTimeout(function(){
            eventDispatcher.emit(req.errorEventKey, 500, 'Processing timeout');
        }, config.clientRequestTimeout);

        fs.stat(req.targetStorePath, function(err, stat) {
            if (stat) {
                var fileAge = Date.now() - stat.mtime;
                if (fileAge <= config.maxAge * 1000) {
                    logger.debug('Request', req.id, 'target store item is still valid.');
                    eventDispatcher.emit(req.targetEventKey, req.targetStorePath);

                    return;
                }
            }

            logger.debug('Request', req.id, 'target store item is stale or non existant.');

            fsUtils.makeParentDirRecursive(req.targetStorePath, function() {                
                converter(req);
            }, function() {
                logger.error('Could not create target store directory', req.targetStorePath);
                eventDispatcher.emit(req.errorEventKey, 500, 'Could not create target store directory.');
            });
        });
    };
};


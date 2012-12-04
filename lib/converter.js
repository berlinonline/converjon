var eventDispatcher = require('./eventDispatcher');
var sourceStore = require('./sourceStore');
var fs = require('fs');

module.exports = function(req) {
    req.sourceEventKey = 'sourceFileReady::' + req.sourceFingerprint;

    eventDispatcher.once(req.sourceEventKey, function(sourceStorePath){
        var sourceFile = fs.createReadStream(sourceStorePath);
        var targetFile = fs.createWriteStream(req.targetStorePath);

        sourceFile.on('end', function() {
            eventDispatcher.emit(req.targetEventKey, sourceStorePath);
        });

        sourceFile.pipe(targetFile);
    });

    sourceStore(req);
};

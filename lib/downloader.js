var http = require('http');
var url = require('url');
var config = require('config').downloader;
var fs = require('fs');
var eventDispatcher = require('./eventDispatcher');
var fsUtils = require('./fsUtils.js');

var activeDownloads = [];

var download = function(req) {

};

module.exports = function(req) {
    var sourceUrl = req.query.url;
    var downloadPath = config.tempPath + req.sourceFingerprint;
    
    fsUtils.makeParentDirRecursive(downloadPath, function() {
        if (activeDownloads.indexOf(sourceUrl) > -1) //url in already being downloaded
        {
            return;
        }

        eventDispatcher.once(req.downloadEventKey, function() {
            activeDownloads.splice(activeDownloads.indexOf(sourceUrl), 1); //remove from active download list
        });

        console.log('downloading');

        http.request(url.parse(sourceUrl), function(response) {
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
                response.on('data', function(data) {
                    console.log(data.length);
                });

                response.on('end', function() {
                    eventDispatcher.emit(req.downloadEventKey, downloadPath);
                });

                response.pipe(fs.createWriteStream(downloadPath));
            }
        }).on('error', function(e){
            eventDispatcher.emit(req.errorEventKey, 502, 'Upstream repsonse error');
        }).end();
    },
    function(err) {
        eventDispatcher.emit(req.errorEventKey, 502, err);
    });
};

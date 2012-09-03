var config = require('config').imageFetcher;
var http = require('http');
var url = require('url');
var fs = require('fs');

var activeDownloads = {};

var downloadCallback = function(imageUrl, mode, code, message) {
    var i = 0;
    var l = activeDownloads[imageUrl].length;
    
    mode = {
        'success': 0,
        'error': 1
    }[mode];

    for (i = 0; i < l; i++){
        activeDownloads[imageUrl][i][mode](code, message);
    }

    delete activeDownloads[imageUrl];
}

var downloadImage = function(imageUrl, targetFile, successCallback, errorCallback) {
    var callbacks = [successCallback, errorCallback];

    if (imageUrl in activeDownloads) {
        activeDownloads[imageUrl].push(callbacks);
        return;
    }

    activeDownloads[imageUrl] = [callbacks];

    http.request(url.parse(imageUrl), function(imageResponse) {
        var i, mime;

        var matches = /[\w-\+]+\/[\w-\+]+/.exec(imageResponse.headers['content-type']);
        if (!matches) {
            downloadCallback(imageUrl, 'error', 422, 'Content type of this URL target can not be parsed.');
            return;
        }

        mime = matches[0];

        if (config.acceptedContentTypes.indexOf(mime) < 0) {
            downloadCallback(imageUrl, 'error', 422, 'Content type of this URL target is not acceptable.');
        } else {
            imageResponse.pipe(fs.createWriteStream(targetFile));
            imageResponse.on('end', function(){
                downloadCallback(imageUrl, 'success');
            });
        }
    }).on('error', function(e){
        downloadCallback(imageUrl, 'error', 502, 'Upstream repsonse error.');
    }).end();
    
};

module.exports = {
    downloadImage: downloadImage,
    isInDownloadQueue: function(url) {
        return typeof activeDownloads[url] !== 'undefined';
    }
};

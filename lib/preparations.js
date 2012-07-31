var config = require('config');
var path = require('path');
var fs = require('fs');

//ensure that the cache dir exists
var makeDirRecursive = function(dir) {
    try {
        var stat = fs.statSync(dir);
        if (!stat.isDirectory()) {
            throw new Error();
        }
    } catch (e) {
        makeDirRecursive(path.dirname(dir));
        fs.mkdirSync(dir);
    }
};
makeDirRecursive(config.imageFetcher.cache.basePath);


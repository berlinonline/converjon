var config = require('config');
var clc = require('cli-color');
var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;

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
makeDirRecursive(config.imageFetcher.cache.sourceBasePath);
makeDirRecursive(config.imageFetcher.cache.targetBasePath);

// check the imagemagick version
var convert = spawn('convert', ['-version']);
convert.stdout.setEncoding('utf8');
convert.stdout.on('data', function(data){
    var matches = /Q\d+/.exec(data);
    if (matches) {
        if (matches[0] == "Q8") {
            console.warn(clc.yellow('WARNING: You are using the Q8 build of ImageMagick, PNG output will not be available.'));
        }
        config.imageConverter.imagemagickBuild = matches[0];
    }
});
convert.on('exit', function(code){
    if (code > 0) {
        console.error(clc.red.bright('ERROR: Detection of ImageMagick failed!'));
        process.exit(1);
    }
});

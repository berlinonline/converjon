var config = require('config');
var clc = require('cli-color');
var spawn = require('child_process').spawn;
var fsUtils = require('./fsUtils');
var instance = require('./instance');

//clear the cache if not in produciton env
if (process.env.NODE_ENV !== "production") {
    try {
        fsUtils.rmdirSyncRecursive(config.targetStore.basePath);
        fsUtils.rmdirSyncRecursive(config.sourceStore.basePath);
        fsUtils.rmdirSyncRecursive(config.downloader.tempPath);
    } catch (e) {
        console.warn(clc.yellow(e.message));
    }
}

//log the instance name
console.log(clc.green('Starting up as ' + instance.getName()));

//log the current environment
console.log('Current environment is [' + process.env.NODE_ENV + ']');

//ensure that the cache dir exists
fsUtils.makeDirRecursiveSync(config.sourceStore.basePath);
fsUtils.makeDirRecursiveSync(config.targetStore.basePath);
fsUtils.makeDirRecursiveSync(config.downloader.tempPath);

// check the imagemagick version
var convert = spawn('convert', ['-version']);
convert.stdout.setEncoding('utf8');
convert.stdout.on('data', function(data){
    var matches = /Q\d+/.exec(data);
    if (matches) {
        if (matches[0] == "Q8") {
            console.warn(clc.yellow('WARNING: You are using the Q8 build of ImageMagick, PNG output will not be available.'));
        }
        config.converter.imagemagickBuild = matches[0];
    }
});

convert.on('exit', function(code){
    if (code > 0) {
        console.error(clc.red.bright('ERROR: Detection of ImageMagick failed!'));
        process.exit(1);
    }
});


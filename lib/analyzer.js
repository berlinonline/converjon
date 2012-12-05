var config = require('config').analyzer;
var eventDispatcher = require('./eventDispatcher');
var process = require('./process');
var logger = require('./logger.js');

var exiftoolConfigPath = __dirname + '/../utils/exiftool/exiftool_config';

var runningAnalyzers = [];

module.exports = function(req) {
    logger.debug('analyzing');
    logger.debug('running analyzers', runningAnalyzers.length);
    if (runningAnalyzers.indexOf(req.sourceStorePath) > -1) //url in already being downloaded
    {
        logger.debug('File is already being analyzed');
        return;
    }

    var removeFromRunningAnylyzers = function() {
        runningAnalyzers.splice(runningAnalyzers.indexOf(req.sourceStorePath), 1); //remove from running analyzer list
    };

    runningAnalyzers.push(req.sourceStorePath);

    var childProcess = process('exiftool', ['-config', exiftoolConfigPath, req.sourceStorePath]);
    childProcess.onSuccess(function(data) {
        var analysis = {};

        var lines = data.trim().replace(/[\n\r]+/, "\n").split("\n");
        lines.forEach(function(line){
            var dim;
            var index = line.indexOf(':');
            var key = line.substring(0, index).trim();
            var value = line.substring(index + 1).trim();
            if (key === "Image Size") {
                index = value.indexOf('=');
                key = value.substring(0, index);
                value = value.substring(index + 1);
                dim = value.split('x');

                analysis['width'] = dim[0];
                analysis['height'] = dim[1];
            } else if (key === config.aoiName){
                analysis['aoi'] = value;
            }
        });

        logger.debug('analysis', analysis);

        removeFromRunningAnylyzers();
        eventDispatcher.emit(req.analysisEventKey, analysis);
    });

    childProcess.onError(function() {
        removeFromRunningAnylyzers();
        logger.debug('error during analysis'); 
    });

    childProcess.run();
}

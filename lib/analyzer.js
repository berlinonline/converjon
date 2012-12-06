var config = require('config').analyzer;
var eventDispatcher = require('./eventDispatcher');
var process = require('./process');
var logger = require('./logger.js');

var exiftoolConfigPath = __dirname + '/../utils/exiftool/exiftool_config';

var runningAnalyzers = [];

module.exports = function(req) {
    if (!req.continueProcessing) {
        logger.debug("Request", req.id, "is marked for non-continuation");
    }

    logger.debug('Request', req.id, 'starting analysis, running analyzers: ', runningAnalyzers.length);
    if (runningAnalyzers.indexOf(req.sourceStorePath) > -1) //url in already being downloaded
    {
        logger.debug('Request', req.id, 'file is already being analyzed. waiting for it to finish', req.sourceStorePath);
        return;
    }

    var removeFromRunningAnylyzers = function() {
        logger.debug("analysis finished", req.sourceStorePath);
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
            } else if (key === "Error") {
                analysis['Error'] = value;
            }
        });
        
        removeFromRunningAnylyzers();
        if (analysis.hasOwnProperty('Error') || !analysis.hasOwnProperty('width')) {
            logger.error("Request", req.id, "Error during image analysis");
            eventDispatcher.emit(req.errorEventKey, 502, 'Error during image analysis. Source file possibly broken.');
            return;
        }

        eventDispatcher.emit(req.analysisEventKey, analysis);
    });

    childProcess.onError(function() {
        removeFromRunningAnylyzers();
        logger.error("Request", req.id, "Error during image analysis");
        eventDispatcher.emit(req.errorEventKey, 502, 'Error during image analysis. Source file possibly broken.');
    });

    childProcess.run();
}

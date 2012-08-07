var config = require('config').imageAnalyzer;
var processPool = require('./processPool');

var runningAnalyzers = {};

var analysisCallback = function(filePath, mode, report) {
    var i;
    var l = runningAnalyzers[filePath].length;
    mode = {error:0, success:1}[mode];
    
    for(i = 0; i < l; i++) {
        runningAnalyzers[filePath][i][mode](report);
    }

    delete runningAnalyzers[filePath];
};

var exiftoolConfigPath = __dirname + '/../utils/exiftool/exiftool_config';

var analyze = function(filePath, error, success) {
    var callbacks = [error, success];

    if (filePath in runningAnalyzers) {
        runningAnalyzers[filePath].push(callbacks);
        return;
    } else {
        runningAnalyzers[filePath] = [callbacks];
    }
    
    var process;
    var report = {
    };

    processPool.getFreeWorker('analyze', function(worker) {
        process = worker.run('exiftool', ['-config', exiftoolConfigPath, filePath]);
        process.stdout.setEncoding('utf8');
        process.stdout.on('data', function(data){
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

                    report['width'] = dim[0];
                    report['height'] = dim[1];
                } else if (key === config.aoiName){
                    report['aoi'] = value;
                }
            });
        });
        process.on('exit', function(code) {
            if (code === 0 && report.width && report.height) {
                analysisCallback(filePath, "success", report);
            } else {
                analysisCallback(filePath, "error");
            }
        });
    });
};

module.exports = {
    analyze: analyze
};


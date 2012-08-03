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
        exif: {}
    };

    processPool.getFreeWorker('identify', function(worker) {
        process = worker.run('identify', ['-format', 'width:%w\nheight:%h\n%[EXIF:*]', filePath]);
        process.stdout.setEncoding('utf8');
        process.stdout.on('data', function(data){
            var lines = data.trim().replace(/[\n\r]+/, "\n").split("\n");
            lines.forEach(function(line){
                var index = line.indexOf(':');
                var key = line.substring(0, index);
                var value = line.substring(index + 1);
                if (key === "exif") {
                    index = value.indexOf('=');
                    key = value.substring(0, index);
                    value = value.substring(index + 1);

                    report.exif[key] = value;
                } else {
                    report[key] = value;
                }
            });
        });
        process.on('exit', function(code) {
            if (code === 0) {
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


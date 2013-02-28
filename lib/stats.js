var events = require('events');
var clone = require('clone');
var emitter = new events.EventEmitter();
var processStats = require('./process').stats;

var stats = {
    requests: {
        successful: 0,
        failed: 0
    },
    downloads: {
        successful: 0,
        failed: 0
    },
    analyzers: {
        successful: 0,
        failed: 0
    },
    converters: {
        successful: 0,
        failed: 0
    },
    processes: {
        waiting: 0,
        running: 0,
        lastEnd: null
    }
};

emitter.on('Request::Success', function() {
    stats.requests.successful ++;
});

emitter.on('Request::Failed', function() {
    stats.requests.failed ++;
});

emitter.on('Download::Success', function() {
    stats.downloads.successful ++;
});

emitter.on('Download::Failed', function() {
    stats.downloads.failed ++;
});

emitter.on('Analyzer::Success', function() {
    stats.analyzers.successful ++;
});

emitter.on('Analyzer::Failed', function() {
    stats.analyzers.failed ++;
});

emitter.on('Converter::Success', function() {
    stats.converters.successful ++;
});

emitter.on('Converter::Failed', function() {
    stats.converters.failed ++;
});

module.exports = {
    emitter: emitter,
    getStats: function() {
        // return a clone of the stats to keep any outside thing from manipualting it.
        var currentStats = clone(stats);
        currentStats.processes = {
            waiting: processStats.waiting(),
            running: processStats.running(),
            lastEnd: processStats.lastEnd()
        };
        return currentStats;
    }
};

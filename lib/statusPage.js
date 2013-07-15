var fs = require('fs');
var config = require('config');
var getStats = require('./stats').getStats;
var logger = require('./logger.js');
var os = require('os');
var instance = require('./instance');

var startTime = new Date();
var MINUTE = 60;
var HOUR = 60 * MINUTE;
var DAY = 24 * HOUR;

var version = 1;

fs.readFile(__dirname + '/../package.json', 'utf8', function(err, data) {
    data = JSON.parse(data);
    version = data.version;
});

var isAlive = function(stats) {
    var lastEnd;
    if (stats.processes.waiting > 0) {
        lastEnd = stats.processes.lastEnd;
        if (Date.now() - lastEnd.getTime() > config.process.maxWaitingTime) {
            return false;
        }
    }

    return true;
};

module.exports = function(options) {
    return function (req, res, next) {
        var stats, alive, reportData, displayData;
        if (/^\/status$/.test(req.url)) {
            stats = getStats();
            alive = isAlive(stats);
            reportData = {
                alive: alive,
                instance_name: instance.getName(),
                hostname: os.hostname(),
                version: version,
                environment: process.env.NODE_ENV,
                stats: stats,
                uptime: Math.floor((Date.now() - startTime.getTime())/1000),
                logTail: logger.tail()
            };

            if (reportData.stats.processes.lastEnd) {
                reportData.stats.processes.lastEnd = reportData.stats.processes.lastEnd.toUTCString();
            }

            if (config.statusPage.localFile) {
                fs.writeFile(config.statusPage.localFile, JSON.stringify(reportData), 'utf8', function() {});
            }

            if (config.statusPage.visible) {
                displayData = reportData;
            } else {
                displayData = {
                    alive: reportData.alive,
                    uptime: reportData.uptime
                };
            }

            res.statusCode = alive ? 200 : 503;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-cache, max-age=0');
            res.write(JSON.stringify(displayData));
            res.end();
        } else {
            next();
        }
    };
};

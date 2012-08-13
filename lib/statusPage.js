var fs = require('fs');
var config = require('config');

var startTime = new Date();
var MINUTE = 60;
var HOUR = 60 * MINUTE;
var DAY = 24 * HOUR;

var version = 1;

fs.readFile(__dirname + '/../package.json', 'utf8', function(err, data) {
    data = JSON.parse(data);
    version = data.version;
});

module.exports = function(optiions) {
    return function (req, res, next) {
        var reportData = {
            alive: true,
            version: version
        };
        var uptime, remainder, days, hours, minutes, seconds;
        if (/^\/status$/.test(req.url)) {
            reportData.uptime = Math.floor((Date.now() - startTime.getTime())/1000);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(reportData));
            res.end();
        } else {
            next();
        }
    }
}

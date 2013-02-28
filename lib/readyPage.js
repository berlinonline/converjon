module.exports = function(options) {
    return function (req, res, next) {
        var reportData = {
            alive: true,
            version: version,
            stats: getStats()
        };
        if (/^\/ready$/.test(req.url)) {
            reportData.uptime = Math.floor((Date.now() - startTime.getTime())/1000);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.write(JSON.stringify(reportData));
            res.end();
        } else {
            next();
        }
    };
};


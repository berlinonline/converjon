whitelist = require('config').imageFetcher.urlWhitelist;

module.exports = function(options) {

    return  function(req, res, next) {
        var urlAllowed = false;

        for (i in whitelist) {
            urlAllowed = new RegExp(whitelist[i]).test(req.query.url) || urlAllowed;
        }

        if (!urlAllowed) {
            res.statusCode = 406;
            res.write("Requesting images from" + req.query.url + " is not allowed.", 'utf8');
            res.end();
            return;
        }

        next();
    };
}

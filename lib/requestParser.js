var config = require('config');
var url = require('url');
var createHash = require('crypto').createHash;

var sha256 = function(data) {
    return createHash('sha256').update(data).digest('hex');
}

var sortProperties = function(obj, deep) {
    deep = typeof deep !== 'undefined' ? !!deep : false;

    var i;
    var keys = [];
    var sorted = {};
    for (i in obj) {
        if (obj.hasOwnProperty(i)) {
            keys.push(i);
        }
    }

    keys.sort();

    for (i = 0; i < keys.length; i++) {
        if (typeof obj[i] === 'object' && !!obj[i] && deep) {
            sorted[i] = sortProperties(obj[i]);
        } else {
            sorted[keys[i]] = decodeURIComponent(obj[keys[i]]);
        }
    }

    return sorted;
};

module.exports = function(options){
    
    return function(req, res, next) {
        
        var query = sortProperties(url.parse(req.url, true).query);

        if (!query.url) {
            res.statusCode = 400;
            res.write('Image URL parameter is missing', 'utf8');
            res.end();
            return;
        }
        
        if (!query.mime) {
            query.mime = config.converter.defaultMimeType;
        }

        var sourceHostName = '';
        var sourceUrlPath = '';
        var parsedUrl;

        try {
            parsedUrl = url.parse(query.url);

            if ("host" in parsedUrl && parsedUrl.host) {
                sourceHostName = parsedUrl.host;
            } else {
                throw new Error('Source URL is invalid.');
            }

            if ("path" in parsedUrl && parsedUrl.path) {
                sourceUrlPath = parsedUrl.path;
            } else {
                throw new Error('Source URL is invalid.');
            }
        } catch (e) {
            res.statusCode = 400;
            res.end(e.message);
            return;
        }


        req.query = query;

        req.targetFingerprint = sourceHostName + sourceUrlPath + '/' + sha256(JSON.stringify(query));
        req.sourceFingerprint = sourceHostName + sourceUrlPath; 

        next();
    };
};


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

var extractHostName = function(url) {
    var matches = /^http:\/\/([^\/]+)/.exec(url);
    if (matches) {
        return matches[1];
    } else {
        throw new Error('Source URL is invalid.');
    }
}

var extractPath = function(url) {

    var matches = /^http:\/\/[^\/]+\/?(.+)/.exec(url);
    if (matches) {
        return matches[1].replace('\/', '_');
    } else {
        throw new Error('Source URL is invalid.');
    }
}

module.exports = function(options){
    
    return function(req, res, next) {
        
        var query = sortProperties(url.parse(req.url, true).query);

        if (!query.url) {
            res.statusCode = 400;
            res.write('Image URL parameter is missing', 'utf8');
            res.end();
            return;
        }

        var sourceHostName = '';
        var sourceUrlPath = '';

        try {
            sourceHostName = extractHostName(query.url);
            sourceUrlPath = extractPath(query.url);

            if(sourceUrlPath.substring(0,1) !== '/') {
                sourceUrlPath = '/' + sourceUrlPath;
            }
        } catch (e) {
            res.statusCode = 400;
            res.end(e.message);
            return;
        }

        req.query = query;

        req.fingerprint = sourceHostName + sourceUrlPath + '/' + sha256(JSON.stringify(query));
        req.sourceFingerprint = sourceHostName + sourceUrlPath; 


        next();
    };
};


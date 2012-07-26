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
            sorted[keys[i]] = obj[keys[i]];
        }
    }

    return sorted;
};

module.exports = function(options){
    
    return function(req, res, next) {
        
        var query = sortProperties(url.parse(req.url, true).query);

        req.query = query;

        req.fingerprint = sha256(JSON.stringify(query));

        next();
    };
};


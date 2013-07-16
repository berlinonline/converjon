var config = require('config').downloader.authentication;

var getUrlCredentials = function(url) {
    var i;

    for (i in config.url) {
        if (url.match(i)) {
            return config.url[i];
        }
    }

    if ("username" in config.global && "password" in config.global) {
        return config.global;
    }

    return null;
};

module.exports = {
    getCredentials: getUrlCredentials
};

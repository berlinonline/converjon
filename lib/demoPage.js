var fs = require('fs');
var config = require('config');

module.exports = function(optiions) {
    return function (req, res, next) {
        if (/^\/demo$/.test(req.url)) {
            var imageTags = [];

            var images = config.demoPage.images;
            var conversions;

            for (image in images) {
                conversions = images[image];

                for (var i = 0; i < conversions.length; i++) {
                    imageTags.push(function(conversion){
                        var parameterString = "url=" + encodeURIComponent(
                            image.replace('%%PORT%%', config.testServer.port)
                        );
                        for (var p in conversion) {
                            parameterString += "&"+p+"="+encodeURIComponent(conversion[p]);
                        }
                        return  '<img src="/?'+parameterString+'" />';
                    }(conversions[i]));
                }
            }

            res.write('<!doctype html><html><body style="width:1000px;">'+imageTags.join('')+'</body></html>');
            res.end();

        } else {
            next();
        }
    }
}

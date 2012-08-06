var fs = require('fs');
var config = require('config').demoPage;
module.exports = function(optiions) {
    return function (req, res, next) {
        if (/^\/demo$/.test(req.url)) {
            var conversions = config.conversions;
            var imageTags = [];

            for (var i = 0; i < conversions.length; i++) {
                imageTags.push(function(conversion){
                    var parameterString = "url="+config.image;
                    for (var p in conversion) {
                        parameterString += "&"+p+"="+encodeURIComponent(conversion[p]);
                    }
                    //parameterString += "&aoi=760,365,1100,850";
                    return  '<img src="/?'+parameterString+'" />';
                }(conversions[i]));
            }

            res.write('<!doctype html><html><body style="width:1000px;">'+imageTags.join('')+'</body></html>');
            res.end();

        } else {
            next();
        }
    }
}

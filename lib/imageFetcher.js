var config = require('config').imageFetcher;
var http = require('http');
var url = require('url');

var Conversion = require('./imageConverter').Conversion;

module.exports = function(options){
    
    return function(req, res, next) {
        var i, whitelist, urlAllowed = false;

        if (!req.query.url) {
            res.statusCode = 400;
            res.write('Image URL parameter is missing', 'utf8');
            res.end();
            return;
        }

        var requestOptions = url.parse(req.query.url);

        var conversion = new Conversion(function(conversion){
            conversion.on('data', function(chunk){
                    console.log('sending', chunk.length);
                res.write(chunk);
            });

            conversion.on('end', function(){
                res.end();
            });

            http.request(requestOptions, function(imageResponse) {
                if (config.acceptedContentTypes.indexOf(imageResponse.headers['content-type']) < 0) {
                    res.statusCode = 422;
                    res.write('Content type of this URL target is not acceptable.');
                    res.end();
                    return;
                }

                conversion.setFormats(imageResponse.headers['content-type'], 'image/jpeg');
                res.setHeader('Content-Type', 'image/jpg');

                imageResponse.on('data', function(chunk) {
                    console.log('received', chunk.length);
                    conversion.write(chunk);
                });

                imageResponse.on('end', function(){
                    conversion.end();
                });
            }).on('error', function(e) {
                //console.log(e);
                next();
            }).end();
        });
    };
};


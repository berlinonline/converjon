var config = require('config').imageFetcher;
var http = require('http');
var url = require('url');

module.exports = function(options){
    
    return function(req, res, next) {
        if (!req.query.url) {
            res.statusCode = 400;
            res.write('Image URL parameter is missing', 'utf8');
            res.end();
            return;
        }

        var requestOptions = url.parse(req.query.url);

        http.request(requestOptions, function(imageResponse) {
            //console.log(imageResponse.headers);

            if (config.acceptedContentTypes.indexOf(imageResponse.headers['content-type']) < 0) {
                res.statusCode = 422;
                res.write('Content type of this URL target is not acceptable.');
                res.end();
                return;
            }

            imageResponse.on('data', function(chunk){
                res.write(chunk);
            });

            imageResponse.on('end', function(){
                res.end();
            });
        }).on('error', function(e) {
            //console.log(e);
            next();
        }).end();
    };
};


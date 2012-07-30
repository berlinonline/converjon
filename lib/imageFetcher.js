var config = require('config').imageFetcher;
var http = require('http');
var url = require('url');
var fs = require('fs');

var Conversion = require('./imageConverter').Conversion;

var rcv = 0;
var snd = 0;

module.exports = function(options){
    
    return function(req, res, next) {
        rcv = snd = 0;
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
                console.log('response write', res.write(chunk));
                snd+=chunk.length;
            });

            conversion.on('end', function(){
                res.end();
                console.log('sent to client', snd);
            });

            http.request(requestOptions, function(imageResponse) {
                if (config.acceptedContentTypes.indexOf(imageResponse.headers['content-type']) < 0) {
                    res.statusCode = 422;
                    res.write('Content type of this URL target is not acceptable.');
                    res.end();
                    return;
                }
                console.log('content-length', imageResponse.headers['content-length']);

                conversion.setFormats(imageResponse.headers['content-type'], 'image/png');
                res.setHeader('Content-Type', 'image/png');

                var tmpFilePath = '/Users/lweidauer/Desktop/temp';

                imageResponse.pipe(fs.createWriteStream('/Users/lweidauer/Desktop/debugIn.jpg'));
                var process = conversion.initializeProcess();

                imageResponse.pipe(process.stdin);
                //process.stdout.pipe(res);
                //process.stdout.pipe(fs.createWriteStream('/Users/lweidauer/Desktop/debugOut.jpg'));

                /*imageResponse.on('data', function(data){
                    console.log('input', data.length);
                });

                process.stderr.setEncoding('utf8');
                process.stderr.on('data', function(data){
                    console.log('STDERR', data);
                });

                var sent = 0;
                process.stdout.on('data', function(data){
                    console.log('output', data.length);
                    sent += data.length;
                });

                process.stdout.on('end', function(data){
                    console.log('sent', sent);
                });*/

                process.on('exit', function(){
                    fs.readFile(tmpFilePath, function(err, data){
                        console.log(arguments);
                        res.write(data);
                        res.end();
                    })
                    //fs.createReadStream(tmpFilePath).pipe(res);
                });

            }).on('error', function(e) {
                //console.log(e);
                next();
            }).end();
        });
    };
};


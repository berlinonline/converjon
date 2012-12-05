process.env.NODE_CONFIG_DIR = __dirname + '/../config';
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
}
var config = require('config').testServer;
var connect = require('connect');

var server = connect();
server.use(function(req,res,next){
    if (req.url == '/url_with_wrong_mime_type') {
        res.setHeader('Content-Type', 'text/plain');
        res.end();
    } else if (req.url == '/broken_file.jpg') {
        res.on('header', function() {
            res.setHeader('Content-Type', 'image/jpeg');
        });
        next();
    } else if (req.url == '/invalid_mime_type') {
        res.on('header', function() {
            res.setHeader('Content-Type', 'image/;');
        });
        req.url = '/test_image_sparrow.jpg';
        next();
    } else {
        res.on('header', function(){
            res.setHeader('Content-Type', res._headers['content-type'] + '; charset=binary;');
        });
        next();
    }
});
server.use(connect.static(__dirname + '/resources', {maxAge: 0}));
server.listen(config.port);

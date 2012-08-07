process.env.NODE_CONFIG_DIR = __dirname + '/../config';
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
}
var config = require('config').testServer;
var connect = require('connect');

var server = connect();
server.use(function(req,res,next){
    if (req.url.indexOf('url_with_wrong_mime_type') >= 0) {
        res.setHeader('Content-Type', 'text/plain');
        res.end();
    } else if (req.url.indexOf('broken_image') >= 0) {
        res.on('header', function() {
            res.setHeader('Content-Type', 'image/jpeg');
        });
        next();
    } else {
        next();
    }
});
server.use(connect.static(__dirname + '/resources', {maxAge: 0}));
server.listen(config.port);

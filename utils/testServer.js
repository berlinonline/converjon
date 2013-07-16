process.env.NODE_CONFIG_DIR = __dirname + '/../config';
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
}
var config = require('config').testServer;
var connect = require('connect');

var checkAuth = function(req) {
    var username, password;
    var auth_regex = /^Basic (.+)/;
    if ('authorization' in req.headers) {
        var matches = auth_regex.exec(req.headers.authorization);
        if (matches) {
            var auth = new Buffer(matches[1], 'base64').toString('ascii').split(':');
            if (auth.length === 2) {
                username = auth[0];
                password = auth[1];
                if (username == 'testuser' && password == 'testpass') {
                    return true;
                }
            }
        }
    }

    return false;
};

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

    } else if (req.url == '/authenticated_url') {
        if (checkAuth(req)) {
            req.url = '/test_image_sparrow.jpg';
            next();
        } else {
            res.statusCode = 401;
            res.on('header', function(){
                res.setHeader('WWW-Authenticate', 'Basic realm=testing');
            });
            res.end();
        }

    } else {
        res.on('header', function(){
            res.setHeader('Content-Type', res._headers['content-type'] + '; charset=binary;');
        });
        next();
    }
});
server.use(connect['static'](__dirname + '/resources', {maxAge: 0}));
server.listen(config.port);

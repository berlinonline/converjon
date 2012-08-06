process.env.NODE_CONFIG_DIR = __dirname + '/../config';
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
}
var config = require('config').testServer;
var connect = require('connect');

var server = connect();
server.use(connect.static(__dirname + '/resources', {maxAge: 0}));
server.listen(config.port);

#!/usr/bin/env node
var fs = require('fs');

process.chdir(__dirname);

process.env.NODE_CONFIG_DIR = __dirname + '/config';
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
}

var config = require('config');

require('./lib/preparations');

var connect = require('connect');

var server = connect();
//server.use(require('connect-bouncer')(require('config').bouncer));
if (config.logging.access) {
    var loggerStream;
    if ("accessLog" in config.logging) {
        loggerStream = fs.createWriteStream(config.logging.accessLog, {
            flags: 'a',
            encoding: 'utf8',
            mode: 0666
        })
    } else {
        loggerStream = process.stdout;
    }

    server.use(connect.logger({stream: loggerStream}));
}

server.use(require('./lib/statusPage')());

//if not in production, also start the test source server and enable the demo page.
if (process.env.NODE_ENV !== 'production') {
    server.use(require('./lib/demoPage')());
    require('./utils/testServer');
}

server.use(require('./lib/requestParser')());
server.use(require('./lib/urlChecker')());
server.use(require('./lib/targetStore')());

server.listen(config.server.port);


#!/usr/bin/env node

process.env.NODE_CONFIG_DIR = __dirname + '/config';
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
}

var config = require('config');

require('./lib/preparations');

var connect = require('connect');

var server = connect();
server.use(require('connect-bouncer')(require('config').bouncer));
if (config.logging) server.use(connect.logger());

//if not in production, also start the test source server and enable the demo page.
if (process.env.NODE_ENV !== 'production') {
    server.use(require('./lib/demoPage')());
    require('./utils/testServer');
}

server.use(require('./lib/requestParser')());
server.use(require('./lib/urlChecker')());
server.use(require('./lib/imageFetcher')());

server.listen(config.server.port);


#!/usr/bin/env node

var config = require('config');

process.env.NODE_CONFIG_DIR = __dirname + '/config';

require('./lib/preparations');

var connect = require('connect');

var server = connect();
server.use(require('connect-bouncer')(require('config').bouncer));
if (config.logging) server.use(connect.logger());
server.use(require('./lib/demoPage')());
server.use(require('./lib/requestParser')());
server.use(require('./lib/urlChecker')());
server.use(require('./lib/imageFetcher')());

server.listen(config.server.port);


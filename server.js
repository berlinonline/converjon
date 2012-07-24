#!/usr/bin/env node

var applyDefaults = require('./defaults');
var args = require('argsparser').parse();
args = applyDefaults(args);

if ("help" in args && args.help)
{
    console.log("\nUsage:");
    console.log("\n-p <port> Sets the server port to <port>, defaults to 8000");
    console.log("\n-h/--help Displays this message.");
    console.log("\n");
    process.exit();
}

var connect = require('connect');
var throttle = require('connect-throttle');

var server = connect()
    .use(throttle({
        threshhold: 1000
    }))
    .use(connect.logger());

server.listen(args.port);

console.log('Server running on port ' + args.port);

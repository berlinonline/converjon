var config = require('config').logging;
var fs = require('fs');

var logStream;

if ("errorLog" in config) {
    logStream = fs.createWriteStream(config.errorLog, {
        flags: "a",
        mode: 0666,
        encoding: 'utf8'
    });
} else {
    logStream = process.stderr;
}

var log = function() {
    var args = Array.prototype.slice.call(arguments, 0, arguments.length);
    var message = args.join(" ");
    var timeStamp = new Date().toUTCString();
    logStream.write("[" + timeStamp + "] " + message + '\n');
};

module.exports = {
    debug: config.debug ? log : function(){},
    error: config.error ? log : function(){}
}

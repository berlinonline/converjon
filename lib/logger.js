var config = require('config').logging;
var fs = require('fs');
var clone = require('clone');

var logStream;
var logTail = [];

var formatMessagePlain = function(message) {
    return message;
};

var formatMessageWithTimestamp = function (message) {
    var timeStamp = new Date().toUTCString();
    return "[" + timeStamp + "] " + message;

};

var formatMessage = formatMessagePlain;

if (config.logWithTimeStamp) {
    formatMessage = formatMessageWithTimestamp;
}

if ("errorLog" in config) {
    logStream = fs.createWriteStream(config.errorLog, {
        flags: "a",
        mode: 0666,
        encoding: 'utf8'
    });
} else {
    logStream = process.stderr;
}

var log = function(id) {
    var args = Array.prototype.slice.call(arguments, 1, arguments.length);
    id = typeof id === "object" ? id.id : id;
    var message = "[" + id + "] " + args.join(" ");
    addToTail(message);
    logStream.write(formatMessage(message) + "\n");
};

var addToTail = function(message) {
    if (logTail.length >= config.tailLength)
    {
        logTail.shift();
    }
    logTail.push(formatMessageWithTimestamp(message));
};

module.exports = {
    debug: config.debug ? log : function(){},
    error: config.error ? log : function(){},
    tail: function() {
        return clone(logTail);
    }
};

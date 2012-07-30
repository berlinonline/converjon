var processPool = require('./processPool');
var EventEmitter = require('events').EventEmitter;
fs = require('fs');

/*
for (var i = 0; i < 20; i++) {
processPool.getFreeWorker(function(worker) {
    var t = Math.floor(Math.random()*5 +1);
    console.log('worker ', worker.id, ': sleep for', t, "seconds");
    worker.run('sleep', [t]);
});

}
*/

var mimeMap = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif"
};
var sent = 0;
var recv = 0;

var getImageMagickFormat = function (mime) {
    if (!(mime in mimeMap)) {
        throw new Error('Unconvertible Mimetype');
    }

    return mimeMap[mime];
};

var getConvertArgs = function(from, to) {
    //return [from+":-", to+":-"];
    return [from+":-", to+":/Users/lweidauer/Desktop/temp"];
};

var Conversion = function(readyCallback) {
    this.process = null;

    this.eventEmitter = new EventEmitter();

    var that = this;
    processPool.getFreeWorker(function(worker) {
        that.worker = worker;
        readyCallback(that);
    });
};

Conversion.prototype = {
    setFormats: function (from, to) {
        this.from = getImageMagickFormat(from);
        this.to = getImageMagickFormat(to);
    },

    initializeProcess: function() {
        var that = this;
        
        console.log(getConvertArgs(this.from, this.to));

        this.process = this.worker.run('convert', getConvertArgs(this.from, this.to));
        console.log('created process', this.process.pid);

        return this.process;
    },

    on: function(eventName, callback) {
        this.eventEmitter.on(eventName, callback);
    }
};

module.exports = {
    Conversion: Conversion
}

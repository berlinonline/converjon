var processPool = require('./processPool');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');

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

var getImageMagickFormat = function (mime) {
    if (!(mime in mimeMap)) {
        throw new Error('Unconvertible Mimetype');
    }

    return mimeMap[mime];
};

var getConvertArgs = function(from, to) {
    return [from+":-", to+":-"];
}

var Conversion = function(readyCallback) {
    this.process = null;

    this.eventEmitter = new EventEmitter();

    var that = this;
    processPool.getFreeWorker(function(worker) {
        that.worker = worker;
        readyCallback(that);
    });
}

Conversion.prototype = {
    setFormats: function (from, to) {
        this.from = getImageMagickFormat(from);
        this.to = getImageMagickFormat(to);
    },

    initializeProcess: function() {
        var that = this;
        
        console.log(getConvertArgs(this.from, this.to));

        this.process = this.worker.run('convert', getConvertArgs(this.from, this.to));
        this.process.stdout.on('data', function(data) {
            that.eventEmitter.emit('data', data);
        });
        this.process.stdout.pipe(fs.createWriteStream('/Users/lweidauer/Desktop/foo.jpg'));
        that.process.stdout.on('end', function(){
            that.eventEmitter.emit('end');
        });
    },

    write: function(chunk) {
        if (!this.process) {
            this.initializeProcess();
        }
        this.process.stdin.write(chunk);
    },

    end: function() {
        this.process.stdin.end();
    },

    on: function(eventName, callback) {
        this.eventEmitter.on(eventName, callback);
    }
};

module.exports = {
    Conversion: Conversion
}

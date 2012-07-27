var config = require('config').processPool;
var Worker = require('./worker');
var EventEmitter = new require('events').EventEmitter;

var eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(1000);

var freeWorkers = [];
var waiting = [];

var freeWorker = function(worker) {
    if (waiting.length > 0) {
        waiting.shift()(worker);
    } else {
        freeWorkers.push(worker);
    }
};

for (var i = 0; i < config.maxWorkers; i++) {
    var worker = new Worker();
    worker.on('free', freeWorker);
    freeWorkers.push(worker);
}

module.exports = {
    getFreeWorker: function(callback) {
        if (freeWorkers.length > 0) {
            callback(freeWorkers.pop());
        } else {
            waiting.push(callback);
        }
    }
};

var config = require('config').processPool;
var Worker = require('./worker');
var EventEmitter = new require('events').EventEmitter;

var eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(1000);

var freeWorkers = [];
var waiting = [];

for (var taskGroup in config) {
    freeWorkers[taskGroup] = [];
    waiting[taskGroup] = [];
    for (var i = 0; i < config[taskGroup].maxWorkers; i++) {
        var worker = new Worker();
        worker.on('free', function(worker) {
            var workerTaskGroup = taskGroup;
            freeWorker(workerTaskGroup, worker);
        });
        freeWorkers[taskGroup].push(worker);
    }
}

var freeWorker = function(taskGroup, worker) {
    if (waiting[taskGroup].length > 0) {
        waiting[taskGroup].shift()(worker);
    } else {
        freeWorkers[taskGroup].push(worker);
    }
};

module.exports = {
    getFreeWorker: function(taskGroup, callback) {
        if (!(taskGroup in freeWorkers)) {
            throw new Error('Unknown taskgroup '+taskgroup);
        }

        if (freeWorkers[taskGroup].length > 0) {
            callback(freeWorkers[taskGroup].pop());
        } else {
            waiting[taskGroup].push(callback);
        }
    }
};

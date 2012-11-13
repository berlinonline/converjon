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
        worker.on('free', function() {
            var workerTaskGroup = taskGroup;
            var currentWorker = worker;
            return function() {
                freeWorker(workerTaskGroup, currentWorker);
            }
        }());
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
            throw new Error('Unknown taskgroup '+taskGroup);
        }

        if (freeWorkers[taskGroup].length > 0) {
            var worker = freeWorkers[taskGroup].pop();
            worker.reserved = true;
            callback(worker);
        } else {
            waiting[taskGroup].push(callback);
        }
    }
};

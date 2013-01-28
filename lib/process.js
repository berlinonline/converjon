var config = require('config').process;
var child = require('child_process');
var eventDispatcher = require('./eventDispatcher');
var logger = require('./logger.js');

var runningProcesses = 0;
var waitingProcesses = [];

eventDispatcher.on('processEnded', function() {
     runningProcesses--;
     processQueueTick();
});

var processQueueTick = function() {
    if (runningProcesses < config.maxRunningProcesses) {
        if (waitingProcesses.length > 0) {
            waitingProcesses.shift()();
        }
    }
};

var Process = function(command, args, callback) {
    runningProcesses++;
    this.command = command;
    this.args = args;
    this.output = '';
};

Process.prototype = {
    run: function() {
        waitingProcesses.push((function() {
            var command = this.command + ' ' + this.args.join(' ');
            logger.debug('Starting process', command);

            this.childProcess = child.exec(command, {
                maxBuffer: config.maxBufferSize,
                timeout: config.timeout
            }, function(error, stdout, stderr) {
                eventDispatcher.emit('processEnded');
                logger.debug('Process ended', command);

                if (error === null) {
                    this.success(stdout.toString('utf8'));
                    
                } else {
                    logger.error("Process error output", command, stderr.toString('utf8'));
                    this.error();
                }
            }.bind(this));
        }).bind(this));

        processQueueTick();
    },
    onSuccess: function(callback) {
        this.success = callback;
    },
    onError: function(callback) {
        this.error = callback;
    }
}

module.exports = function(command, args) {
    logger.debug('Process requested', "running processes:", runningProcesses, "waiting processes:", waitingProcesses.length);
    return new Process(command, args);
};


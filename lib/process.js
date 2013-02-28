var config = require('config').process;
var child = require('child_process');
var eventDispatcher = require('./eventDispatcher');
var logger = require('./logger.js');

var runningProcesses = 0;
var waitingProcesses = [];
var lastEnd = null;

eventDispatcher.on('processEnded', function() {
    runningProcesses = runningProcesses - 1;
    lastEnd = new Date();
    processQueueTick();
});

var processQueueTick = function() {
    if (runningProcesses < config.maxRunningProcesses) {
        if (waitingProcesses.length > 0) {
            runningProcesses = runningProcesses + 1;
            waitingProcesses.shift()();
        }
    }
};

var Process = function(command, args, callback) {
    this.command = command;
    this.args = args;
    this.output = '';
};

Process.prototype = {
    run: function() {
        waitingProcesses.push((function() {
            var command = this.command + ' ' + this.args.join(' ');
            logger.debug('Starting process', command);

            try {
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
            } catch (e) {
                this.error();
            }
        }).bind(this));

        processQueueTick();
    },
    onSuccess: function(callback) {
        this.success = callback;
    },
    onError: function(callback) {
        this.error = callback;
    }
};

module.exports = {
    stats: {
        waiting: function() {
            return waitingProcesses.length;
        },
        running: function() {
            return runningProcesses;
        },
        lastEnd: function() {
            return lastEnd;
        }
    },
    create: function(command, args) {
        logger.debug('Process requested', "running processes:", runningProcesses, "waiting processes:", waitingProcesses.length);
       return new Process(command, args);
    }
};


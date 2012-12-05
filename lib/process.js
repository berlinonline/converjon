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
            logger.debug('Starting process', this.command, this.args.join(" "));
            this.childProcess = child.spawn(this.command, this.args);
            this.childProcess.stdout.setEncoding('utf8');
            this.childProcess.stdout.on('data', (function(data) {
                this.output += data;
            }).bind(this));

            this.childProcess.stderr.setEncoding('utf8');
            this.childProcess.stderr.on('data', (function(data) {
                logger.error("Process error output", data);
            }).bind(this));

            this.childProcess.once('exit', (function(code, signal) {
                logger.debug('Process ended', this.command, this.args.join(" "), "with return code", code);

                if (code === 0) {
                    this.success(this.output);
                } else {
                    this.error();
                }

                eventDispatcher.emit('processEnded');
            }).bind(this));
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


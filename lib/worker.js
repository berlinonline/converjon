var child = require('child_process');
var config = require('config').worker;
var EventEmitter = require('events').EventEmitter;

var nextWorkerId = 0;

var Worker = function() {
    this.id = nextWorkerId++;
    this.reserved = false;
    this.timeout = null;

    this.eventEmitter = new EventEmitter();
}

Worker.prototype = {
    run: function(command, args, cwd) {
        var that = this;
        
        this.timeout = setTimeout(function(){
            that.destroy(true);
        }, config.maxRunTime);

        this.process = child.spawn(command, args, {
            cwd: cwd
        });
        
        this.process.on('exit', function(){
            that.destroy();
        });
        this.process.stdout.setEncoding('utf8');
        this.process.stdout.on('data', function(data){
        });

        return this.process;
    },

    destroy: function(kill) {
        kill = typeof kill === 'boolean' ? kill : false;

        var signal = kill ? 'SIGKILL' : 'SIGTERM';

        if (this.process) {
            this.process.kill(signal);
        }

        this.eventEmitter.emit('destroy', this);
        clearTimeout(this.timeout);
        this.free();
    },

    free: function() {
        this.process = null;
        if (this.reserved) {
            this.reserved = false;
            this.eventEmitter.emit('free', this);
        }
    },

    on: function(eventName, callback){
        this.eventEmitter.on(eventName, callback);
    }
}

module.exports = Worker;

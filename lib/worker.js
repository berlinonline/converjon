var child = require('child_process');
var EventEmitter = require('events').EventEmitter;

var nextWorkerId = 0;

var Worker = function() {
    this.id = nextWorkerId++;
    this.active = false;

    this.eventEmitter = new EventEmitter();
}

Worker.prototype = {
    run: function(command, args, cwd) {
        var that = this;
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

        this.free();
    },

    free: function() {
        this.eventEmitter.emit('free', this);
        this.process = null;
    },

    on: function(eventName, callback){
        this.eventEmitter.on(eventName, callback);
    }
}

module.exports = Worker;

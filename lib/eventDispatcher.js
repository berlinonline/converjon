var events = require('events');

var emitter = new events.EventEmitter();

emitter.setMaxListeners(500);

module.exports = emitter;

/*
var log = function() {
    var mode;

    if (arguments.length > 0) {
        switch (arguments[0]) {
            case "debug":
            case "warn":
                mode = arguments[0];
                break;
            default:
                mode = "debug";
        }
    }
};
*/

module.exports = {
    debug: function() {
        console.log.apply(console, arguments);
    },
    error: function() {
        console.log.apply(console, arguments);
    },
    warn: function() {
        console.log.apply(console, arguments);
    }
}

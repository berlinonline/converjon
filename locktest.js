var lock = require("./lib/lock");

var i, name;
for(i = 0; i < 100; i++) {
    if (i < 50) {
        name = "foo";
    } else {
        name = "bar";
    }

    (function() {
        var n = name;
        var m = i;
        console.log("requesting lock for", n, m);
        lock(n).then(function(free) {
            console.log("lock released for", n, m);
            setTimeout(free, +(Math.random()*500));
        });
    })();
}

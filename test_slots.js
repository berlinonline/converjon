var slots = require("./lib/slots");
var pool = slots(12);

console.log(pool);

for (var i = 0; i < 20; i++) {
    pool().then(function(free){
        console.log("new slot");
        setTimeout(free, 1000);
    });
}

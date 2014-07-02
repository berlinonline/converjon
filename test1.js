var download = require("./lib/download");

var url = "http://www.lnwdr.de/assets/2014/me_2014-02.jpg";

var p = download(url);
p.then(function(path, length) {
    console.log("PATH", path);
});
p.catch(function(error) {
    console.log("ERROR", error);
});


download(url);
download(url).then(function(){
    console.log("third download resolved");
});
setTimeout(function(){
    download(url);
}, 100);


var m = require("./lib/fsutils").mkdirp("foo/bar/batz");

m.then(function(p){
    console.log("path", p, "created");
});

setTimeout(function() {
    m.then(function(p){
        console.log("path", p, "still created");
    });
}, 2000);

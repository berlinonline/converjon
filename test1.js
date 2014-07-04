var download = require("./lib/download");
var config = require("./lib/config");

var url = "http://www.lnwdr.de/assets/2014/me_2014-02.jpg___";
var url2 = "http://www.lnwdr.de/assets/2014/arches.jpg";

config.load([]);


var p = download(url);
p.then(function() {
    console.log("first download resoved");
});
p.then(function(path, length) {
    console.log("PATH", path);
});
p.catch(function(error) {
    console.log("ERROR", error);
});


download(url).then(function(){
    console.log("second download resolved");
});
download(url).then(function(){
    console.log("third download resolved");
});
setTimeout(function(){
    download(url).then(function(){
        console.log("fourth download resolved");
    });
}, 100);

download(url2).then(function(){
    console.log("fifth download resolved");
});

download("http://");

var fs = require('fs');
var path = require('path');

var makeDirRecursive = function(dir) {
    try {
        var stat = fs.statSync(dir);
        if (!stat.isDirectory()) {
            throw new Error();
        }
    } catch (e) {
        makeDirRecursive(path.dirname(dir));
        fs.mkdirSync(dir);
    }
};

var rmdirSyncRecursive = function(path) {
    var contents = fs.readdirSync(path);
    contents.forEach(function(element) {
        var elementPath = path + '/' + element;
        var stat = fs.statSync(elementPath);
        if (stat && stat.isDirectory()) {
            rmdirSyncRecursive(elementPath);
        } else {
            fs.unlinkSync(elementPath);
        }
    });
    fs.rmdirSync(path);
};

module.exports = {
    makeDirRecursive: makeDirRecursive,
    rmdirSyncRecursive: rmdirSyncRecursive
};


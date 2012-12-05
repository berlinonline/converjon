var fs = require('fs');
var path = require('path');

var makeDirRecursiveSync = function(dir) {
    try {
        fs.statSync(dir);
    } catch (e) {
        makeDirRecursiveSync(path.dirname(dir));
        fs.mkdirSync(dir);
    }
};

var makeParentDirRecursive = function(filePath, success, error) {
    makeDirRecursive(path.dirname(filePath), success, error);
};

var makeDirRecursive = function(dirPath, success, error) {
    fs.stat(dirPath, function(err, stat) {
        if (stat) {
            if (stat.isDirectory()) {
                success();
            } else {
                error();
            }
        } else {
            makeDirRecursive(path.dirname(dirPath), function() {
                fs.mkdir(dirPath, function(err) {
                    if (err) {
                        if (err.code == "EEXIST") {
                            success();
                        } else {
                            error();
                        }
                    } else {
                        success();
                    }
                });
            }, error);
        }
    });
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
    makeParentDirRecursive: makeParentDirRecursive,
    makeDirRecursiveSync: makeDirRecursiveSync,
    rmdirSyncRecursive: rmdirSyncRecursive
};


/* jshint globalstrict: true */
/* global require */
/* global exports */
/* global __dirname */
"use strict";

var fs = require("fs");

var path = require("path");
var yaml = require("js-yaml");
var cjson = require("cjson");
var merge = require("./merge");
var match = require("./match");

var pathutils = require("./pathutils");

var configs = [];

var default_config_path = pathutils.join([
    __dirname,
    "..",
    "config",
    "default.yml"
]);

var default_config = loadFile(default_config_path);

function loadFile(file_path) {
    var extension = path.extname(file_path);
    var parser;

    switch (extension) {
        case ".yml":
            parser = function(str) {
                return yaml.safeLoad(str);
            };
            break;
        case ".json":
            parser = function(str) {
                return cjson.parse(str);
            };
            break;
        default:
            throw new Error("Unknown config extension: " + extension);
    }

    return parser(fs.readFileSync(file_path, "utf-8"));
}

/**
 * WARNING: THIS FUNCTION PERFORMS SYNCHRONOUS I/O OPERATIONS!
 *
 * @param {array} a list of config files to load.
 */
exports.load = function(file_paths) {
    file_paths = file_paths || [];

    configs = [default_config];

    file_paths.forEach(function(f){
        var cfg = loadFile(f);

        if (cfg.urls && cfg.urls.length > 0) {
            // server config is not allowed in URL specific configs
            delete cfg.server;
        }
        configs.push(cfg);
    });
};

/**
 * Merges all configs that match the given key in the order that they where loaded.
 * If no key is given, the default config is returnes.
 *
 * This function always returns clones of confiog objects.
 *
 * @param {string} the key to match configs against
 * @returns {object} the merged configuration object
 */
exports.get = function(key) {
    return merge.apply(null, configs.filter(function(cfg){
        if (cfg.alias === key) {
            return true;
        }

        if (key && Object.prototype.toString.call(cfg.urls) == "[object Array]") {
            return cfg.urls.reduce(function(carry, current) {
                return carry || match(current, key);
            }, false);
        } else {
            return true;
        }
    }));
};

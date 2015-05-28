/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
/* global console */

"use strict";

var stats = require("../stats");
var logging = require("../logging");

function get_http_error(error) {
    var http_error = {
        message: error.message,
        code: error.code
    };

    switch (error.code) {
        case 401:
        case 403:
            http_error.message = "Authentication to source server failed.";
            http_error.code = 500;
            break;
        case 404:
            http_error.message = "Source URL doesn't exist.";
            http_error.code = 400;
            break;
        default:
            //http_error.message = "Source server sent an unexpected response.";
            http_error.code = 400;
    }

    return http_error;
}

function handle_error_response(item, res) {
    var error = item.error;
    stats.request_failure();
    res.setHeader("Content-Type", "text/plain");

    var message = error.message;

    //console.log("Error message", item.error);
    logging.error(message);

    switch (error.name) {
        case "FileSystemError":
            message = "File access error";
            res.statusCode = 500;
            break;
        case "ConversionError":
            res.statusCode = 500;
            break;
        case "ConstraintError":
            res.statusCode = 400;
            break;
        case "SourceHttpError":
            var http_error = get_http_error(error);
            res.statusCode = http_error.code;
            message = http_error.message;
            break;
        case "UrlWhitelistError":
            res.statusCode = 400;
            break;
        default:
            res.statusCode = 400;
    }

    res.setHeader("Content-Length", message.length);
    res.end(message);
}

module.exports = handle_error_response;

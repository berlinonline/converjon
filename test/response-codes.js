process.env.NODE_ENV = "testing";

var vows = require('vows');
var assert = require("assert");
var http = require('http');
var events = require('events');
var config = require('config');

require("../server"); //start the server

vows.describe("Successful requests").addBatch({
    "when the requested URL is whitelisted": {
        topic: function() {
            http.request({
                hostname: 'localhost',
                port: config.server.port,
                path: '/?url=http://localhost:' + config.testServer.port + '/test_image_sparrow.jpg',
                method: 'GET'
            }, this.callback).end();
        },
        "the response code should be 200": function(res, err) {
            assert.equal(res.statusCode, 200);
        }
    }
}).addBatch({
    "when the requested URL is not whitelisted": {
        topic: function() {
            http.request({
                hostname: 'localhost',
                port: config.server.port,
                path: '/?url=http://example.org',
                method: 'GET'
            }, this.callback).end();
        },
        "the response code should be 406": function(res, err) {
            assert.equal(res.statusCode, 406);
        }
    }
}).addBatch({
    "when mime tyoe of the requested url is not supported": {
        topic: function() {
            http.request({
                hostname: 'localhost',
                port: config.server.port,
                path: '/?url=http://localhost:' + config.testServer.port + '/url_with_wrong_mime_type',
                method: 'GET'
            }, this.callback).end();
        },
        "the response code should be 422": function(res, err) {
            assert.equal(res.statusCode, 422);
        }
    }
}).addBatch({
    "when mime tyoe of the requested url is not invalid": {
        topic: function() {
            http.request({
                hostname: 'localhost',
                port: config.server.port,
                path: '/?url=http://localhost:' + config.testServer.port + '/invalid_mime_type',
                method: 'GET'
            }, this.callback).end();
        },
        "the response code should be 422": function(res, err) {
            assert.equal(res.statusCode, 422);
        }
    }
}).addBatch({
    "when the metadata fo the source file is broken": {
        topic: function() {
            http.request({
                hostname: 'localhost',
                port: config.server.port,
                path: '/?url=http://localhost:' + config.testServer.port + '/broken_file.jpg',
                method: 'GET'
            }, this.callback).end();
        },
        "the response code should be 502": function(res, err) {
            assert.equal(res.statusCode, 502);
        }
    }
}).addBatch({
    "when the url parameter is missing": {
        topic: function() {
            http.request({
                hostname: 'localhost',
                port: config.server.port,
                path: '/',
                method: 'GET'
            }, this.callback).end();
        },
        "the response code should be 400": function(res, err) {
            assert.equal(res.statusCode, 400);
        }
    }
}).export(module);


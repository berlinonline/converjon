process.env.NODE_ENV = "testing";
var vows = require('vows');
var assert = require("assert");

var authentication = require("../lib/authentication");

vows.describe("Authentication configurations").addBatch({
    "when there are configured credentials for http://example.org": {
        topic: function() {
            return authentication.getCredentials('http://example.org');
        },
        "they should be returned.": function(topic) {
            assert.equal(topic.username, 'example_user');
            assert.equal(topic.password, 'example_pass');
        }
    },
    "when there are no credentials for http://other.example.org": {
        topic: function() {
            return authentication.getCredentials('http://other.example.org');
        },
        "null should be returned.": function(topic) {
            assert.equal(topic, null);
        }
    }
})['export'](module);


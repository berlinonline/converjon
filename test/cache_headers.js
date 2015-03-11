/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var util = require("../lib/util");

module.exports = {
    testMaxAgeAndExpires: function(test) {
        test.expect(2);

        var now = new Date();
        var response_date = new Date(now.valueOf());
        response_date.setSeconds(response_date.getSeconds() - 70);

        var expires_fresh = new Date(now.valueOf());
        expires_fresh.setSeconds(expires_fresh.getSeconds() + 10);

        var expires_stale = new Date(now.valueOf());
        expires_stale.setSeconds(expires_stale.getSeconds() - 10);

        var test_headers_fresh = {
            "Cache-Control": "max-age=90",
            "Expires": expires_fresh.toString(),
            "Date": response_date.toString()
        };

        var test_headers_stale = {
            "Cache-Control": "max-age=90",
            "Expires": expires_stale.toString(),
            "Date": response_date.toString()
        };

        test.strictEqual(util.headers_still_fresh(test_headers_fresh), true);
        test.strictEqual(util.headers_still_fresh(test_headers_stale), false);
        test.done();
    },

    testMaxAgeOnly: function(test) {
        test.expect(2);

        var now = new Date();
        var response_date = new Date(now.valueOf());
        response_date.setSeconds(response_date.getSeconds() - 70);

        var test_headers_fresh = {
            "Cache-Control": "max-age=90",
            "Date": response_date.toString()
        };

        var test_headers_stale = {
            "Cache-Control": "max-age=50",
            "Date": response_date.toString()
        };

        test.strictEqual(util.headers_still_fresh(test_headers_fresh), true);
        test.strictEqual(util.headers_still_fresh(test_headers_stale), false);
        test.done();
    },

    testExpiresOnly: function(test) {
        test.expect(2);

        var now = new Date();
        var response_date = new Date(now.valueOf());
        response_date.setSeconds(response_date.getSeconds() - 70);

        var expires_fresh = new Date(now.valueOf());
        expires_fresh.setSeconds(expires_fresh.getSeconds() + 10);

        var expires_stale = new Date(now.valueOf());
        expires_stale.setSeconds(expires_stale.getSeconds() - 10);

        var test_headers_fresh = {
            "Expires": expires_fresh.toString(),
            "Date": response_date.toString()
        };

        var test_headers_stale = {
            "Expires": expires_stale.toString(),
            "Date": response_date.toString()
        };

        test.strictEqual(util.headers_still_fresh(test_headers_fresh), true);
        test.strictEqual(util.headers_still_fresh(test_headers_stale), false);
        test.done();
    },

    testExpiresPastMaxAge: function(test) {
        test.expect(1);

        var now = new Date();
        var response_date = new Date(now.valueOf());
        response_date.setSeconds(response_date.getSeconds() - 70);

        var expires = new Date(now.valueOf());
        expires.setSeconds(expires.getSeconds() + 10);

        var test_headers = {
            "Cache-Control": "max-age=10",
            "Expires": expires.toString(),
            "Date": response_date.toString()
        };

        test.strictEqual(util.headers_still_fresh(test_headers), true);
        test.done();
    },

    testMaxAgePastExpires: function(test) {
        test.expect(1);

        var now = new Date();
        var response_date = new Date(now.valueOf());
        response_date.setSeconds(response_date.getSeconds() - 70);

        var expires = new Date(now.valueOf());
        expires.setSeconds(expires.getSeconds() - 10);

        var test_headers = {
            "Cache-Control": "max-age=100",
            "Expires": expires.toString(),
            "Date": response_date.toString()
        };

        test.strictEqual(util.headers_still_fresh(test_headers), false);
        test.done();
    },

    testBothOutdated: function(test) {
        test.expect(1);

        var now = new Date();
        var response_date = new Date(now.valueOf());
        response_date.setSeconds(response_date.getSeconds() - 70);

        var expires = new Date(now.valueOf());
        expires.setSeconds(expires.getSeconds() - 10);

        var test_headers = {
            "Cache-Control": "max-age=10",
            "Expires": expires.toString(),
            "Date": response_date.toString()
        };

        test.strictEqual(util.headers_still_fresh(test_headers), false);
        test.done();
    },
};


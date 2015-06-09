/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
"use strict";
var rsvp = require("rsvp");
var Promise = rsvp.Promise;

var pathutils = require("../lib/pathutils");
var config = require("../lib/config");
config.load([
    pathutils.join([__dirname, "resources", "test_config.yml"])
]);
var convert = require("../lib/convert");
var lock = require("../lib/lock").lock;

var source_lock;
var source_lock_broken;
var target_lock1;
var target_lock2;

module.exports = {

    setUp: function(cb) {

        lock(pathutils.join([
            __dirname,
            "resources",
            "images",
            "test_image_sparrow_2.jpg"
        ])).then(function(l) {
            source_lock = l;
        });

        lock(pathutils.join([
            __dirname,
            "resources",
            "images",
            "not_existing_image.jpg"
        ])).then(function(l) {
            source_lock_broken = l;
        });

        lock(pathutils.join([
            "/tmp",
            "converjon_test_image_sparrow_converted.jpg"
        ])).then(function(l) {
            target_lock1 = l;
        });

        lock(pathutils.join([
            "/tmp",
            "converjon_test_image_sparrow_converted_2.jpg"
        ])).then(function(l) {
            target_lock2 = l;
        });

        rsvp.all([
            source_lock,
            source_lock_broken,
            target_lock1,
            target_lock2
        ]).then(function(){
              cb();
        });
    },

    testConvertSuccess: function(test) {
        var conf = config.get();
        var options = {
            width: 800,
            height: 600,
            crop_rect: [2300,500,1000,800],
            quality: 10,
            format: "jpeg"
        };
        convert(source_lock, target_lock1, options, conf).then(function(target_path){
            test.done();
        });
    },

    testConvertFailure: function(test) {
        var conf = config.get();
        var options = {
            width: 800,
            height: 600,
            crop_rect: [2300,500,1000,800],
            quality: 10,
            format: "jpeg"
        };
        convert(source_lock_broken, target_lock2, options, conf).catch(function(err){
            test.done();
        });
    },

    tearDown: function(cb) {
        source_lock();
        source_lock_broken();
        target_lock1();
        target_lock2();
        cb();
    }
};


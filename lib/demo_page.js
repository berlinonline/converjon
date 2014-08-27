/* jshint globalstrict: true */
/* global require */
/* global module */
/* global __dirname */
"use strict";

var Handlebars = require("handlebars");
var pathutils = require("./pathutils");
var fs = require("fs");

var template_path = fs.realpathSync(pathutils.join([
    __dirname,
    "..",
    "resources",
    "demo.handlebars"
]));
var source = fs.readFileSync(template_path).toString("utf-8");
var template = Handlebars.compile(source);

var images = {
    "test_image_sparrow.jpg":  [
        "&width=130&height=300&quality=5",
        "&width=170&height=300&quality=10",
        "&width=215&height=300&quality=20",
        "&width=485&height=300&quality=30",

        "&width=1000&height=200&quality=70",
        "&width=1000&height=100&quality=70"
    ],
    "test_image_sparrow_2.jpg":  [
        "&width=400&height=370",
        "&width=600&height=370&format=gif&colors=2",
        "&width=1000",
        "&width=1000&quality=5"
    ]
};

function get_image_data() {
    var images_data = [];
    var i,j, options_string;
    var base_url = "http://localhost:8001/";
    var base_image_url = "http://localhost:8002/";

    for(i in images) {
        if (images.hasOwnProperty(i)) {
            for (j in images[i]) {
                if (images[i].hasOwnProperty(j)){
                    images_data.push(
                        base_url +
                        "?url=" +
                        encodeURIComponent(base_image_url + i) +
                        images[i][j]
                    );
                }
            }
        }
    }

    return images_data;
}

module.exports = function(res) {
    var data = {
        images: get_image_data()
    };

    res.setHeader("Content-Type", "text/html");
    res.end(template(data));
};

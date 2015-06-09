/* jshint globalstrict: true */
/* global module */
/* global require */
/* global __dirname */

"use strict";

var Handlebars = require("handlebars");
var pathutils = require("../pathutils");
var fs = require("fs");
var conf = require("../config").get();

var template_path = fs.realpathSync(pathutils.join([
    __dirname,
    "..",
    "..",
    "resources",
    "load_test.handlebars"
]));

var source = fs.readFileSync(template_path).toString("utf-8");
var template = Handlebars.compile(source);

var css_path = fs.realpathSync(pathutils.join([
    __dirname,
    "..",
    "..",
    "resources",
    "load_test_style.css"
]));

var style = fs.readFileSync(css_path);

var base = "/?url=";


var images = [
    "https://upload.wikimedia.org/wikipedia/commons/8/88/Bayeux_Tapestry_de_Montfaucon_16.jpg","https://upload.wikimedia.org/wikipedia/commons/1/1e/Avtandil_and_Sograt._MSS_H_2074._42r.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/7/73/N7606s.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/2/2e/Gaithersburg%2C_Maryland.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/6e/Bellagio_flickr01.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/7/72/Appareil_portatif.png",
    "https://upload.wikimedia.org/wikipedia/commons/c/cb/Patagonian.png",
    "https://upload.wikimedia.org/wikipedia/commons/3/3d/HMS_Hecla_1982_Gibraltar.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/b/b0/1999_tempete-decembre_05.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/1/1d/Meiner-Medalist_IMG_7156_20140413.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/e/e7/Ext-Night.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/b/bb/John_Frederick_Kensett_-_Snowy_Range_and_Foothills_from_the_Valley_of_Valmo_-_Google_Art_Project.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/0/06/George_Caleb_Bingham_-_Canvassing_for_a_Vote_-_Google_Art_Project.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/8f/Tectonic_plates_movement_pt_BR.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/8d/2012-05-28_Fotoflug_Cuxhaven_Wilhelmshaven_DSCF9815.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/5d/Summit_Lake_of_Lassen_Volcanic_National_Park.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/5b/Cyclonic_Storm_Murjan%2C_24_October_2012.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/1b/2006-05-18-Palais_de_Rumine-Lausanne-atrium-bas-reliefs_02.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/7/7b/Kruses_gate_5B.JPG",
    "https://upload.wikimedia.org/wikipedia/commons/d/d7/Bust_Hadrian_Musei_Capitolini_MC817.jpg"
];


var base = "/?url=";

var body = template({
    style: style,
    base: base,
    images: JSON.stringify(images)
});

module.exports = function(res) {
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Length", body.length);
    res.end(body);
};

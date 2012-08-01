Converjon
=========

An on-the-fly image conversion service

Dependencies (apart from node modules)
-
  * ImageMagick
    * use the Q8 version to save memory
    * however, Q16 (the default one) is required to support PNG image output
  * node.js
  * NPM

Installation
-

  * download or clone the repository
  * change into the directory of the repository
  * `npm install -d`
  * start with `node server.js` (preferrably with nodemon)

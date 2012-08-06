Converjon
=========

An on-the-fly image conversion service

Dependencies (apart from node modules)
-
  * ImageMagick
    * use the Q8 version to save memory
    * however, Q16 (the default one) is required to support PNG image output
  * ExifTool
  * node.js
  * NPM (usually included in node.js)

Installation
-

  * download or clone the repository
  * change into the directory of the repository
  * `npm install -d` to install the dependency libs
  * start with `npm start`

Testing
-
  * Execute tests with `npm test`

Copyright notes
-
The "sparrow" testing image is © Leon Weidauer, permission to use it for testing is granted.

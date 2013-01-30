Converjon
=========

An on-the-fly image conversion service

Dependencies (apart from node modules)
-
  * ImageMagick
    * use the Q8 version to save memory
    * however, Q16 (the default one) is required to support PNG image output
  * ExifTool (at least version 9)
  * node.js
  * NPM (usually included in node.js)

Installation
-

You can install Converjon from NPM with `npm install converjon` or you can:

  * download or clone the repository
  * change into the directory of the repository
  * `npm install -d` to install the dependency libs

After installation, you may need to adjust some things:

  * set your environment (production/development/testing) via the `NODE_ENV` environment variable (defaults to "development")
  * start with `npm start`

There are some optional OS specific start/stop scripts under `utils/os_helpers/` which you can also use.

Configuration
-

###Server
 * `port`: port for the server to listen on

###Logging
 * `errorLog`: Absolute path to error log file.
 * `accessLog`: Absolute path to access log file.
 * `error` (boolean): wether to log errors at all.
 * `debug` (boolean): wether to log debug output (this may be A LOT)
 * `access` (boolean): wether to log client requests (Apache style)

###Constraints

Image requests can be constrained within configurable boundaries. This can be done globally and for regular expressions matching source URLs. If a request exceeds these limits, an HTTP 400 is returned with a notice, what went wrong.

Currently there are 4 possible constraints:

  * width
  * height
  * quality (meaning JPEG quality)
  * color (meaning GIF color depth)

Each of these values can have a `max` and a `min` property. Both are optional. You can also specify just one boundary.

Example from `config/default.json`:

    {
    //...
        "constraints": {
            "global": {
                "width": {
                    "min": 1,
                    "max": 2000
                },
                "height": {
                    "min": 1,
                    "max": 2000
                },
                "quality": {
                    "min": 1,
                    "max": 95
                },
                "colors": {
                    "min": 2,
                    "max": 256
                }
            },
            "url": {
                "^.+:\/\/localhost": {
                    "quality": {
                        "max": 100,
                        "min": 20
                    }
                }
            }
        }
    // ...
    }

This example includes some global contraints that apply to every request and some overridden contraints for request with aource URLs from localhost.

Usage
-

Example image URL: http://example.org/image.jpg

To get the image through Converjon, put the original URL into the request as a URL encoded parameter:

    http://localhost/?url=%20http%3A%2F%2Fexample.org%2Fimage.jpg

More options are available as GET parameters. All parameters need to be URL encoded.

Several example are available on the `/demo` page which is enabled in "testing" and "development" environments.

###Changing size

You can either supply a `width`, `height` or both. If you only supply one dimension, the other one will be derived from the original images aspect ratio.

If you supply both values, the image will be cropped to the new aspect ratio, if necessary, and is then resized to the requested pixel dimensions.

###Area of Interest

By default images are cropped from the center of the original. You can specify an "area of interest" with the `aoi` parameter. The AOI is a rectangle in the folling format:
    
    offsetX,offsetY,width,height

The AOI can also be embedded in the original images metadata via EXIF or IPTC. The name of this metadata field can be configured and defaults to `aoi`. If the images metadata specifies an AOI, it is preferre over the AOI in the GET parameter.

If an AOI is set, croppping will ensure, that the area is always preserved.

###Image Format

With the `mime` parameter you can change the format of the image. Supported types are:
  * image/jpeg
  * image/png
  * image/gif

###Quality

The `quality` parameter sets the JPEG quality value. It ranges from 1 to 100 (integer).

This parameter is ignored, if the requested mime type is not `image/jpeg`.

###Color Palette

The `colors` parameter sets the number of colors for GIF compression. It ranges from 2 to 256 (integer).

Testing
-
  * Execute tests with `npm test`

Copyright notes
-
The "sparrow" testing image is © Leon Weidauer, permission to use it for testing is granted.

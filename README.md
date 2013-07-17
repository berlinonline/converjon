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

###Environment

The configuration file are read and merged in this order:

1. default.json
1. [environment].json
1. runtime.json

[environment] is a string that can be set with the environment variable `NODE_ENV` or by placing a plain text file called
"environment" in the root directory of the application. This file has to contain one single line (no line breaks). The
contents of this line will be used as the environment string.

The environment variable always takes precedence over the text file.

###Server
 * `port`: port for the server to listen on

###URL whitelisting

URLs from which images are allowed to be donwloaded must be whitelisted in the `urlChecker.urlWhitelist` config
property.

Example from [default.json](config/default.json):

    "urlChecker": {
        "urlWhitelist": {
            "localhost": "^.+:\/\/localhost",
            "127.0.0.1": "^.+:\/\/127.0.0.1",
            "::1": "^.+:\/\/::1"
        }
    }

###Bouncer

Converjon uses [connect-bouncer](https://github.com/lnwdr/connect-bouncer) for basic protection against DoS.
It can be configured with the `bouncer` config property.

* `threshhold`: Requests per second that are allowed from a single host
* `limit`: Number of requests from a single host that are allowed before the bouncer starts checking for the
  `threshhold`

Example from [default.json](config/default.json):

    "bouncer": {
        "threshhold": 10,
        "limit": 100
    }

###Downloader

The `downloader` config sets options for handling the downloads from source URLs.

* `tempPath`: Directory for temp files
* `acceptedContentTypes`: content types that are accepted from source servers

You can configure HTTP basic auth credentials  globally or for certain URLs with `downloader.authentication`.
The URLs are specified via regular expressions.

Merged example from [testing.json](config/testing.json) and [default.json](config/default.json):

    "downloader": {
        "tempPath" : "./cache/temp/",
        "acceptedContentTypes": [
            "image/jpeg",
            "image/pjpeg",
            "image/png",
            "image/gif"
        ],
        "authentication": {
            "global": {
            },
            "url": {
                "\\/authenticated_url$": {
                    "username": "testuser",
                    "password": "testpass"
                },
                "http:\\/\\/example\\.org": {
                    "username": "example_user",
                    "password": "example_pass"
                }
            }
        }
    }

###Processes

The `process` config property defines how many external processes (imagemagick/exiftool) can be spawned simultaneously
and how long they are allowed to run.

* `maxRunningProcesses`: Maximum number of simultaneously running processes
* `timeout`: time in milliseconds before a process is killed if it doesn't finish running before.
* `maxWaitingTime`: time in milliseconds that processes can wait until the `alive` flag in the /status page will change
  to `false`and the /status page will no longer return an HTTP 200 code but 503 instead.

Example from [development.json](config/development.json):

     "process": {
            "maxRunningProcesses": 2,
            "timeout": 5000,
            "maxWaitingTime": 10000
      }

###Storage

Storage is configured with the `targetStore` and `sourceStore` properties.

* `basePath`: Path to the directory to use for storing files
* `maxAge`: time in seconds after which an image will be treated as stale nad will be refreshed.
* `clientRequestTimeout`: (only for targetStore) Timeout after which the client HTTP request will be canceled,
  regardless of how the processing went.

Example from [default.json](config/default.json):

    "targetStore": {
        "basePath": "./cache/target/",
        "maxAge": 10,
        "clientRequestTimeout": 10000
    },
    "sourceStore": {
        "basePath": "./cache/source/",
        "maxAge": 300
    }

###Logging

The `logging` property lets you configure the logging behaviour:

 * `errorLog`: Absolute path to error log file.
 * `accessLog`: Absolute path to access log file.
 * `error` (boolean): wether to log errors at all.
 * `debug` (boolean): wether to log debug output (this may be A LOT)
 * `access` (boolean): wether to log client requests (Apache style)
 * `logWithTimeStamp`: wether or not to include timestamps in log messages

Example from [default.json](config/default.json):

    "logging": {
        "access": true,
        "debug": false,
        "error": true,
        "tailLength": 20,
        "logWithTimeStamp": false
    }

###Converter Options

The `converter` config allows some basic setting for image conversion.

* `defaultMimeType`: The type to which images will be converted if the request doesn't specify any.
* `paddingColor`: HEX RGB color value that is used for padding areas, if cropping requires any.

Example from [default.json](config/default.json):

    "converter": {
        "defaultMimeType": "image/jpeg",
        "paddingColor": "#DFDFDF"
    }

###Analyzer Options

The `analyzer` config contains basic setting for image analysis.

* `aoiName`: The name of the AOI metadata field

Example from [default.json](config/default.json):

    "analyzer": {
        "aoiName": "aoi"
    }

###Constraints

Image requests can be constrained within configurable boundaries. This can be done globally and for regular expressions matching source URLs. If a request exceeds these limits, an HTTP 400 is returned with a notice, what went wrong.

Currently there are 4 possible constraints:

  * width
  * height
  * quality (meaning JPEG quality)
  * color (meaning GIF color depth)

Each of these values can have a `max` and a `min` property. Both are optional. You can also specify just one boundary.

Example from [default.json](config/default.json):

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

Status Page
-

The URL /status leads to a summary of Converjons current state. Example output:

    {
      "alive": true,
      "instanceName": "scrawny-example",
      "hostname": "Ganymede.local",
      "version": "1.7.0",
      "environment": "development",
      "stats": {
        "requests": {
          "successful": 0,
          "failed": 0
        },
        "downloads": {
          "successful": 0,
          "failed": 0
        },
        "analyzers": {
          "successful": 0,
          "failed": 0
        },
        "converters": {
          "successful": 0,
          "failed": 0
        },
        "processes": {
          "waiting": 0,
          "running": 0,
          "lastEnd": null
        }
      },
      "uptime": 4,
      "logTail": []
    }

The `alive` value will be `false`, if there are processes waiting and the last process finished more than `config.process.maxWaitingTime` milliseconds ago.

Testing
-
  * Execute tests with `npm test`

Copyright notes
-
The "sparrow" testing image is © Leon Weidauer, permission to use it for testing is granted.

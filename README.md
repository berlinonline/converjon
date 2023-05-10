# Converjon

**BEWARE: This repository is no longer maintained. It is archived. Big thank you to all contributors.** 

<http://berlinonline.github.io/converjon>

An advanced image conversion server and command line tool.

* [Features](#features)
* [Dependencies](#dependencies)
* [Installation](#installation)
* [Running](#running)
* [Usage](#usage)
    * [Changing Size](#changing-size)
    * [Area of Interest](#area-of-interest)
    * [Cropping Mode](#cropping-mode)
    * [Padding Color](#padding-color)
    * [Cropping Mode](#cropping-mode)
    * [Image format](#image-format)
    * [Quality](#quality)
    * [Color Palette](#color-palette)
    * [Interlaced Images](#interlaced-images)
    * [Presets](#presets)
    * [Status Page](#status-page)
* [Configuration](#configuration)
    * [Server](#server)
    * [Aliases](#aliases)
    * [Downloads](#downloads)
    * [Authentication](#authentication)
    * [Cache](#cache)
    * [Garbage Collector](#garbage-collector)
    * [Processes](#processes)
    * [Converter](#converter)
    * [Cropping](#cropping)
    * [Constraints](#constraints)
    * [Logging](#logging)
* [Testing](#testing)
* [Contributing](#contributing)
* [Changelog](#changelog)
* [Copyright Notes](#copyright-notes)

## Features

* thumbnail generation
* [responsive images](http://dev.opera.com/articles/responsive-images/)
* intelligent cropping
* [art direction use cases](http://usecases.responsiveimages.org/#art-direction)
* adaptive image quality
* no need to pre-generate different image sizes or versions

## Dependencies

* [ImageMagick](http://www.imagemagick.org/script/binary-releases.php)
* [ExifTool](http://www.sno.phy.queensu.ca/%7Ephil/exiftool/install.html) (at least version 9)
* [node.js and NPM](http://nodejs.org/download/)
    * The [crypto module](https://nodejs.org/api/crypto.html) must be supported/included in the nodejs build

## Installation

Use NPM: ``npm install [-g] converjon``

If you want to prevent the fixed dependency versions of the ``npm-shrinkwrap.json`` file to be used on install use ``--no-shrinkwrap`` as a command line argument. See [shrinkwrap docs](https://docs.npmjs.com/cli/shrinkwrap) and [install docs](https://docs.npmjs.com/cli/install) for more information on this.

Converjon follows [Semantic Versioning](http://semver.org/).

## Running

Manually on commandline, as a system service or via docker.

### Manually

Start the server with `converjon [--config your_config_file]` or use the command line utility `converjon-cli` to work on local files.

### Docker

```sh
docker run -t -p 8000:8000 -v $(pwd)/config/default.yml:/etc/converjon/config.yml berlinonline/converjon:latest
```

or

```sh
docker run -e USE_CONFIG_DIR=true -t -p 8000:8000 -v $(pwd)/config/:/etc/converjon/config berlinonline/converjon:latest
```

## Usage

Let's say you have an image at `http://example.org/image.jpg`. To get the image through Converjon, put the original URL into the request as a URL encoded parameter:

    http://localhost/?url=%20http%3A%2F%2Fexample.org%2Fimage.jpg

Another alternative is to specify a file from the server's file system as the source. Instead of `url`, you can add the
`file` parameter for this:

    http://localhost/?file=foobar%3Asome%2Fdirectory%2Fimage.jpg

The `file` parameter is URL-encoded. In plain text it is `foobar:some/directory/image.jpg`.

Here, `foobar` is the name of a filesystem alias followed by a colon and a relative path. See [Configuration: Aliases](#aliases) for more details.

More options are available as GET parameters. All parameters need to be URL encoded.

Several examples are available on the `/demo` page which is enabled when starting Converjon with the [development config file](https://github.com/berlinonline/converjon/blob/master/config/development.yml) via ``converjon --dev``.

It's recommended to set the server port to `80` in [configuration](#server) and to run Converjon on a separate subdomain of your site or behind a reverse proxy like Nginx or Varnish.

For information on how to use the command line tool, run `conversion-cli --help`.

### Changing size

You can either supply a `width`, `height` or both. If you only specify one dimension, the other one will be derived from the original image's aspect ratio.

If you set both values, the image may be cropped to the new aspect ratio and then resized to the requested pixel dimensions.

### Area of Interest

[Wiki: Area of Interest](https://github.com/berlinonline/converjon/wiki/Area-of-Interest)

By default images are cropped from the center of the original. You can specify an "area of interest" with the `aoi` parameter. The AOI is a rectangle in the following format:

    offsetX,offsetY,width,height

The AOI can also be embedded in the original image's metadata via EXIF or IPTC. The name of this metadata field can be configured and defaults to `aoi`. The request parameter overrides the AOI value from the image's metadata.

By default, the AOI in the URL parameters has precedence over the one from the image's metadata. To prefer the embedded AOI from the metadata, set the `prefer_embedded_aoi` parameter to any non-empty value.

### Cropping mode

The `crop` parameter sets the cropping mode. Available modes are:

* `centered`
* `aoi_coverage`
* `aoi_emphasis`
* `aoi_auto`

Details about the cropping modes can be found [here in the wiki](https://github.com/berlinonline/converjon/wiki/Cropping-Modes). For examples, see the [demo page](http://berlinonline.github.io/converjon/demo/demo.html).

If an AOI is set, cropping will ensure, that the area is always preserved.

### Padding Color

The `padding_color` parameter sets the background color of the padding.

The color should be specified in an HTML URL Encoded format.

If none specified, the default color set in the configuration will be used.
[see also Converter config](#converter)

### Image Format

With the `format` parameter you can change the format of the image. Supported formats are:

* `jpg` or `jpeg`
* `png`
* `gif`

If no specific format is requested, the format of the source image will be used.

### Quality

The `quality` parameter sets the JPEG quality value. It ranges from `1` to `100`.

This parameter is ignored, if the requested format is not JPEG.

### Color Palette

The `colors` parameter sets the number of colors for GIF compression. It ranges from 2 to 256 (integer).

### Interlaced Images

The `interlace` parameter allows the creation of [interlaced images](http://en.wikipedia.org/wiki/Interlacing_(bitmaps)). Supported types of interlacing scheme are:

* `plane`(try this for JPEGs)
* `line`
* `none`

A well-known example of interlaced images are progressive JPEGs. You can use this option with PNGs and GIFs as well.

### Presets

The `preset` parameter allows the automatic usage of a preset of parameters.

New presets may be added in the configuration files as follows:

```YAML
presets:
  thumbnail:
      format: "jpg"
      quality: 50
      width: 100
      hight: 100
```

So instead of specifying all the parameters in the URL:

``?url=...&width=100&height=100&format=jpg&quality=50``

you can use the preset:

``?url=...&preset=thumbnail``

### Removing Metadata

The `strip_metadata` option removes all metadata (e.g. EXIF, IPTC) from the converted images. This option has no value, it just needs to be present in the URL query parameters.

### Status Page

The URL `/status` leads to a summary of Converjon's current state and some statistics.

The status page is available as content type `application/json` via `/status.json`.

## Configuration

When launching converjon, you can specify one or more configuration files with the `--config` option which can be set multiple times to load multiple config files:

```sh
converjon --config conf_file1.yml --config conf_file2.json
```

To load a directory containing one or more config file, use the `--config-dir` option. Config files will be added in the order they appear in that directory.

```sh
converjon --config-dir /etc/converjon
```

You can use the [default.yml](https://github.com/berlinonline/converjon/blob/master/config/default.yml) or [development.yml](https://github.com/berlinonline/converjon/blob/master/config/development.yml) file as an example for writing your own.

The default configuration format is YAML but you can also use JSON files.

Every configuration file matches certain image source URLs. If a config file contains a `urls` setting, that configuration will only apply to URLs that match at least one of the patterns from that list. Config files without the `url` setting apply to all images.

Some configuration are automatically converted:

* "true" (string) is treated as `true`(bool)
* "false" (string) is treated as `false`(bool)

```yaml
# this config will only apply to source URLs from localhost or flickr
urls:
  - "http://localhost*" #this will match URLs on localhost, this is the dev/testing default
  - "http://www.flickr.com*"
```

Converjon uses [calmcard](https://github.com/lnwdr/calmcard) for string pattern matching. Documentation on how these patterns work can be found there.

This way you can define different settings depending on the source of the requested images.

### Server

```yaml
server:
  port: 8000
  instance_name: null
  timeout: 20000
  send_timeout: 2000 #time that sending the repsonse data may take.
  access_log_format: "combined"
  base_url_path: "/"
  enable_load_test: false
```

* `server.port`: port for the server to listen on
* `server.instance_name`: the name of this server that will be displayed on the status page

If not set, a random name will be generated.

* `server.timout`: global timeout for incoming requests
* `server.send_timeout`: the time streaming a finished image file into the HTTP response may take. This usually shouldn't need to be changed, except when the servers file system is expected to be exceptionally slow.
* `server.base_url_path`: Normally, Converjon's image URL paths just start with `/`, like in `http://www.example.org/?url=...`

You can set a base path to have better control over the URLs that Converjon uses. If you want the image URLs too like `http://www.example.org/photos/?url=...` set the `base_url_path` to "photos/".

* `server.access_log_format`: the formatting of access logs:
    * `combined`: Apache Combined Log Format (the default)
    * `short`: leaves out the date/time information. Use this, if you use other software for log handling that adds timestamps.

### Downloads

**URL whitelists**
`download.url_whitelist` sets list of URL patterns that are allowed to be requested as image sources.

For example, if you host your source images on `http://myimages.com/images/...` you should set the whitelist pattern to `http://myimages.com/images/` to make sure other sources are not allowed.

```yaml
# this will only allow requests for images from URLs that match these patterns
download:
  url_whitelist:
    - "http://localhost*"
    - "http://example.org/*
```

[Calmcard](https://github.com/lnwdr/calmcard) patterns are used for matching by default.

You can also prefix the pattern with ``~`` (like ``~ ^http://(foo|bar)\.example.org\/.*``) to use regular expressions. For most cases, this should not be necessary and is discouraged.

**Timeout**
`download.timeout` sets a timeout after which requests are cancelled, if the source server doesn't respond in time.

**Reject Invalid SSL Certificates**
Setting `download.rejectInvalidSSL` to `true` (default) will cause sources to be rejected, if their SSL certificates cannot be validated.

### Aliases

To access the server's local filesystem for source images, you can specify "aliases":

```yaml
#example from the development configuration files:
alias: dev

base_file_path: "test/resources/images"

fallback_base_file_paths:
  - "test/resources/photos"
  - "test/resources/misc"

headers:
  Cache-Control: "max-age=5"
```

When an image is requested with a `file` parameter (`<alias>:<path>`) instead of `url`, the `alias` part of that parameter is matched against the configuration files, just like with URLs but only the configs that have that **exact** alias will be used for that request.

There can only be one alias per config file. If you need multiple aliases, you need to have one config file for each of them. See [here](#configuration) on how to load multiple config files.

In a config file with an alias you can set a `base_file_path`. This is the directory where your source images are located. It is concatenated with the `path` part of the `file` parameter to point to the actual file. The `base_file_path` can be an absolute path or relative to the working directory of the server.

Additionally there can be multiple `fallback_base_file_paths`. If the requested file can't be found in the
`base_file_path`, Converjon will try to find it in the first fallback path, then the second, and so on.

In addition, you can set HTTP headers that will be sent along with the converted image as if they had come from a source server.

### Authentication

Converjon supports HTTP basic authentication for image sources. If you include authentication credentials in a URL specific configuration file, they will be sent along with every request to URLs that match the URL pattern of that configuration file.

```YAML
authentication:
  username: "testuser"
  password: "testpass"
```

### Cache

`cache.basepath` sets the base directory for the local file cache.

```YAML
cache:
  base_path: "/tmp/converjon/cache"
```

`cache.copy_source_file` determines, if a source file should be copied, when you're using a local file as source. By
default, files are copied into Converjon's cache directory. Set this to `false` to use the original file's location.
*You will have to make sure that these files are not changed while Converjon is using them. This could result in corrupted images or failing requests.*

The cache directory is not automatically cleaned up and may grow over time.

### Garbage Collector

Converjon can clean up the cache directory automatically. By default this is disabled. It can be enabled with the
`garbage_collector` config directives:

```YAML
garbage_collector:
  enabled: true
  source: "cache"
  target: "immediate"
  interval: 5000
```

* `enabled`: turns the garbage collector on or off
* `source`: determines when source files should be cleaned up. Possible values are:
    * `cache`: The file will be removed when it's cache lifetime has expired
    * `immediate`: The file will be removed as soon as it's no longer in use by any pending request.
    * any other value will disable the cleanup for source files
* `target`: same as `source` but for the converted target image files
* `interval`: time between garbage collector runs, in milliseconds.

Local source files that were not copied into the cache directory will not be removed by the garbage collector.

### Processes

`process.limit` sets the maximum number of child processes that converjon will spawn for converting and analyzing images.

Increasing this will likely increase memory consumption while providing better usage of multiple CPU cores.

### Converter

* `converter.padding_color` sets the background color that is used, if an image needs padding to fit the requested aspect ratio.
* `converter.filter` sets the filter, e.g. "Sinc"
* `converter.quality` sets the quality of the resulting resized image (number, e.g. 85)

### Cropping

`cropping.default_mode` sets the default mode for cropping images. Possible options are: `centered`, `aoi_coverage`, `aoi_emphasis` and `aoi_auto`.

[Wiki: Cropping Modes](https://github.com/berlinonline/converjon/wiki/Cropping-Modes)

### Constraints

Constraints can be used to limit the possible request parameters, like width and height of images. Every constraint has a `min` and a `max` value:

```YAML
constraints:
  quality:
    min: 1
    max: 100
  colors:
    min: 1
    max: 256
  width:
    min: 1
    max: 10000
  height:
    min: 1
    max: 10000
```

### Logging

There are three logging levels: `access`, `error` and `debug`. Each of them can be directed to either STDOUT, STDERR or into a log file.

```YAML
logging:
  error: "stderr" # will log errors to STDERR
  debug: "stdout" # will log debug logs to STDOUT
  access: "/var/log/access.log" # will log requests into a log file
```

To disable a log level, set it to `false`:

```YAML
logging:
  error: "stderr"
  debug: false # "false" as a string will also work
  access: "/var/log/access.log"
```

Logs are not automatically rotated. Use of a tool like `logrotate` is recommended.

## Testing

Execute tests with `npm test`. Please note, that you need to have all [dependencies](#dependencies) installed.

## Contributing

Please contribute by [forking](http://help.github.com/forking/) and sending a [pull request](http://help.github.com/pull-requests/). More information can be found in the [`CONTRIBUTING.md`](CONTRIBUTING.md) file.

## Changelog

See [`CHANGELOG.md`](CHANGELOG.md) for more information about changes.

## Copyright Notes

Converjon is [licensed under the MIT license](LICENSE).

The "sparrow" testing image is © Leon Weidauer, permission to use it for testing is granted.

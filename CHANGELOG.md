# 2.5.0 (2015-06-10)

* Garbage collector for cache items (#19)
* Fixed a long standing bug that caused locks to accumulate (#107)
* Fixed a bug in cache that caused item to always invalidate immediately (#104)
* Boolean config values can now also be written as strings (#104)
* Added fallback local file paths (#102)
* Local source files can be used without copying (#100)
* Additional test page to run server under continuous load (#18)

# 2.4.2 (2015-06-03)

* fixed a critical bug in error handling (#99)

# 2.4.1 (2015-06-02)

* Security: more strict validation of numeric parameters (#94)
* Security: "nosniff" HTTP header (#98)
* NPM shrinkwrap (#96)
* Release documentation (#97)
* added missing package.json infos (#95)

# 2.4.0 (2015-05-28)

* Bugfix: matching of configs against keys (#92)
* Added support getting source files from filesystem instead of URLs (#91)
* Added config option to disable source URL header (#78)
* Improved error logging (#93)
* Added blur effect (#89)
* Added configurable URL base path (#90)

# 2.3.0 (2015-05-07)

* Add parameter presets (#70)
* Interactive cropping on `/demo` page (#79)
* Padding color is now changable via URL parameter (#80)

# 2.2.1 (2015-04-07)

* Fix counting too many requests. (#81)
* Bring back debug logging (#82)
* Fix accumulating locks for failing downloads (#83)

# 2.2.0 (2015-03-16)

* Added error reporting when converting non existing files in CLI (#74)
* Added logging level "info" in configs, defaults o STDOUT
* Introduced `download.rejectInvalidSSL` option (#76)
* Added `strip_metadata` parameter (#67)
* Fixed timeout on sources with 0 bytes length (#73)
* Added validation of AOI, is now rejected if it doesn't fit inside the source image (#72)


# 2.1.0 (2015-01-05)

* Added support for interlaced images via `interlace` parameter (think progressive JPGs, #65)
* Added support for status page as `application/json` via `/status.json` (#64)
* Added error message when port is already in use on server startup (#68)
* Added [CONTRIBUTING.md](CONTRIBUTING.md) with hints on how to help this project (#66)
* Modified help messages for server and CLI (#58, #59)
* Fixed typo in error message (#60)
* Made scripts in `bin/` executable and modified README a bit (#65 and #66)

# 2.0.1

* Updated dependencies to fix security issues #61
* Updated package.json description

# 2.0.0

**Braking changes:**
* installation via NPM
* no more environment configuration
* config format has changed
* `mime` parameter is replaced by `format`
* status page no longer delivers JSON data
* HTTP response codes for errors have changed

**Features/Bugfixes**
* major rewrite and refactoring
* new cache system #44
* custom configurations per URL #48
* new cropping modes #30
* improved cache header handling #29
* installable via NPM #47
* source URL in response headers #46
* GIF size bug fixed #42
* removed connect.js dependency #45
* new unit tests
* improved reponse code handling #43
* new status page #51

1.8.0
=
* Added config `downloader.rejectUnauthorized` #41

1.7.1
=
 * Filled in missing documentation

1.7.0
=
 * added hostname to status info. #26
 * added random/configurable intance name to status info. #33
 * environment can now be set via textfile. #35
 * fixed a memory leak cause by unfinished download requests. #36
 * configurable HTTP basic auth for source URLs. #37
 * improved debug logging to enable easier tracing of requests. #39
 * better test coverage
 * fixed various typos

1.6.4
=
 * fixes a critical bug that caused the server to become unresponsive. #34

1.6.3
=
 * fixes an issue where "NaN" values could be passed as the cropping reactagnle for imagemagick. #27
 * fixes download events accumulating in the central event emitter. #32
 * fixed a problem where node.js' http client connection limit would prevent some tests from running.

1.6.2
=
 * fixed some missing error handlers
 * added node 0.10.x to "engine" dependency

1.6.1
=
 * added no-cache header to /status page

1.6.0
=
 * Fixed a bug that caused the process waiting counter to be incremented too soon which prevented processes from being started.
 * added process stats to /status page
 * added actual "alive" value to /status page (see README.md)
 * /status page will now return HTTP 503 if alive value is not true
 * added log tail readout to /status page
 * added option to write local status file (same content as /status page)
 * added option to reduce /status page output to a minimum

1.5.1
=
 * Fixed a bug that caused subsequent requests to once failed downloads to timeout
 * some code cleanup

1.5.0
=
 * added fetching images from HTTPS sources
 * added configurable constraints
 * added Etag support
 * added stats to status page

1.4.2
=
 * fix incomplete/corrupt stdout data from exiftool that resulted in "Error during image analysis" failures.
 * improved analyzer error logging
 * fix temp cache directory not being cleared at server launch

1.4.1
=

 * fix AoiCropping algorithm, no more skewed images
 * fix order of "process ended" events to free up resources sooner

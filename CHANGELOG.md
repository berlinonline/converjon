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

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

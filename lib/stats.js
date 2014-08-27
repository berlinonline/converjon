/* jshint globalstrict: true */
/* global require */
/* global module */
"use strict";

var locks = 0;
var requests = {
    successful: 0,
    failed: 0
};

var downloads = {
    successful: 0,
    failed: 0
};


var conversions = {
    successful: 0,
    failed: 0
};


module.exports = {
    request_success: function() {
        requests.successful++;
    },
    request_failure: function() {
        requests.failed++;
    },


    download_success: function() {
        downloads.successful++;
    },
    download_failure: function() {
        downloads.failed++;
    },


    conversion_success: function() {
        conversions.successful++;
    },
    conversion_failure: function() {
        conversions.failed++;
    },


    lock_add: function() {
        locks++;
    },
    lock_remove: function() {
        locks--;
    },

    get_report: function() {
        return {
            locks: locks,
            requests: {
                successful: requests.successful,
                failed: requests.failed
            },
            downloads: {
                successful: downloads.successful,
                failed: downloads.failed
            },
            conversions: {
                successful: conversions.successful,
                failed: conversions.failed
            }
        };
    }
};

define('jira/util/version', ['jira/util/data/meta'], function (Meta) {
    'use strict';

    var Version = {};

    Version.get = function () {
        return Meta.get('version-number');
    };

    Version.compare = function (str2) {
        var JiraVersion = Meta.get('version-number');

        if (!JiraVersion) {
            return;
        }

        var parts1 = JiraVersion.split(".");
        var parts2 = str2.split(".");
        var ret = -1;
        var len = parts1.length;

        if (parts1.length > parts2.length) {
            len = parts2.length;
            ret = 1;
        } else if (parts1.length === parts2.length) {
            ret = 0;
        }
        // Make sure 1.09 < 1.3, 1.30 > 1.9, 1.030 < 1.09
        for (var i = 0; i < len; i++) {
            var i1 = void 0;
            var i2 = void 0;
            var p1 = parts1[i];
            var p2 = parts2[i];
            var pat = /^(0+)(.*)$/;
            var m1 = p1.match(pat);
            var m2 = p2.match(pat);

            if (m1 != null) {
                p1 = "0." + p1;
                i1 = parseFloat(p1);
            } else {
                i1 = parseInt(p1, 10);
            }

            if (m2 != null) {
                p2 = "0." + p2;
                i2 = parseFloat(p2);
            } else {
                i2 = parseInt(p2, 10);
            }

            if (i1 < i2) {
                return -1;
            }

            if (i1 > i2) {
                return 1;
            }
        }

        return ret;
    };

    Version.isGreaterThanOrEqualTo = function (ver) {
        return Version.compare(ver) !== -1;
    };

    return Version;
});

AJS.namespace('JIRA.Version', null, require('jira/util/version'));
define('jira/license/license-manager', ['wrm/data', 'exports'], function (wrmData, exports) {
    'use strict';

    var json = wrmData.claim('jira.core:dc-license-info.data');

    var licenses = {};
    Object.defineProperty(licenses, 'isDcLicense', {
        value: json ? json['isDcLicense'] : false
    });

    /**
     * @returns true if Jira is either DC licensed or it's running in dev mode, false otherwise
     */
    exports.isDcLicense = function () {
        return licenses['isDcLicense'];
    };
});
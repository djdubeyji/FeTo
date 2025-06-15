require(['jquery', 'wrm/data', 'jira/flag'], function (jQuery, WrmData, Flag) {
    "use strict";

    jQuery(function () {
        // eslint-disable-line @atlassian/onready-checks/no-jquery-onready
        var infoMessage = WrmData.claim("dashboardInfoMessage");
        var installMessage = WrmData.claim("dashboardInstallMessage");
        if (infoMessage) {
            Flag.showInfoMsg('', infoMessage);
        }
        if (installMessage) {
            Flag.showSuccessMsg('', installMessage);
        }
    });
});
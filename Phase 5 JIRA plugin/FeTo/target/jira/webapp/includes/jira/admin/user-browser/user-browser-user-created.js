define('jira/admin/user-browser/user-created', ['jira/util/logger', 'jquery', 'jira/flag', 'jira/admin/user-browser/user-browser-flags', 'wrm/data'], function (logger, $, Flag, observer, wrmData) {
    'use strict';

    function showUserCreatedFlag(displayNames) {
        Flag.showSuccessMsg(null, JIRA.Templates.Admin.UserBrowser.userCreatedFlag({
            names: displayNames
        }));
        logger.trace('user-created-flag');
    }

    $(function () {
        // eslint-disable-line @atlassian/onready-checks/no-jquery-onready
        observer.whenFlagSet("userCreatedFlag", function () {
            var displayNames = wrmData.claim("UserBrowser:createdUsersDisplayNames");
            if (displayNames && displayNames.length > 0) {
                showUserCreatedFlag(displayNames);
            }
        });
    });
});
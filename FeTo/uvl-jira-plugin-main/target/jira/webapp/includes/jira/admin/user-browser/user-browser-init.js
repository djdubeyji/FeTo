require(['jira/admin/user-browser', 'jquery', 'jira/admin/user-browser/user-created'], function (UserBrowser, jQuery) {
    'use strict';

    jQuery(function () {
        // eslint-disable-line @atlassian/onready-checks/no-jquery-onready
        UserBrowser.initToggleLists();
        UserBrowser.initNewUsersTip("#invite_user", "#create_user");
    });
});
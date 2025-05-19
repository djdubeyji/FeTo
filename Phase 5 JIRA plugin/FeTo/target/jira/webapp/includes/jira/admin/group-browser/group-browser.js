require(['jquery', 'jira/admin/group-browser/group-label-lozenge'], function ($) {
    'use strict';

    $(function () {
        // eslint-disable-line @atlassian/onready-checks/no-jquery-onready
        $(".operations-list .aui-button[disabled]").tooltip({ gravity: 'e', html: false });
    });
});
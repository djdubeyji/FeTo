require(['jira/admin/application/approleseditor', 'jquery'], function (ApplicationRoles, $) {
    "use strict";

    $(function () {
        // eslint-disable-line @atlassian/onready-checks/no-jquery-onready
        new ApplicationRoles({
            el: "#application-roles"
        });
    });
});
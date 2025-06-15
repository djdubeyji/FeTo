require(['jquery', 'jira/tabs/tab-manager', 'jira/dashboard/dashboards-table'], function (jQuery, TabManager, DashboardsTable) {
    "use strict";

    jQuery(function () {
        // eslint-disable-line @atlassian/onready-checks/no-jquery-onready
        TabManager.navigationTabs.init({
            customInit: DashboardsTable.init,
            tabParam: "view"
        });
    });
});
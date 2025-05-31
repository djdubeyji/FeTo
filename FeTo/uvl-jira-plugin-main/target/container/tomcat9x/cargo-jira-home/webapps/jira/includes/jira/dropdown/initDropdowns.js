require(['jira/dropdown/element/default-dropdown', 'jira/dropdown/element/issue-actions-trigger', 'jira/dropdown/dropdown-factory', 'jquery'], function (DefaultDropdownElement, // eslint-disable-line @atlassian/module-checks/no-unused-deps
IssueActionsTriggerElement, // eslint-disable-line @atlassian/module-checks/no-unused-deps
DropdownFactory, $) {
    'use strict';

    $(function () {
        // eslint-disable-line @atlassian/onready-checks/no-jquery-onready
        DropdownFactory.bindNavigatorOptionsDds();
        DropdownFactory.bindConfigDashboardDds();
    });
});
require(['jquery', 'jira/admin/custom-fields/user-picker-filter/config'], function (jQuery, userPickerFilterConfig) {
    'use strict';

    // render the filter selector panel

    jQuery(function () {
        // eslint-disable-line @atlassian/onready-checks/no-jquery-onready
        userPickerFilterConfig.initializeFromConfigPage();
    });
});
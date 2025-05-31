require(['jira/common/header', 'wrm/require-lazily', 'jquery'], function (Header, wrmRequireLazily, jQuery) {
    'use strict';

    // On dom ready

    jQuery(function () {
        // eslint-disable-line @atlassian/onready-checks/no-jquery-onready
        Header.initialize();

        var delayInMilliseconds = 5000; //wait for 5 seconds for other important functionality to complete on page

        setTimeout(function () {
            wrmRequireLazily('wrc!jira.webresources:header-dimensions');
        }, delayInMilliseconds);
    });
});
require(['jquery'], function (jQuery) {
    'use strict';

    jQuery(document).on('click', '.workflow-mapping-issue-type', function () {
        jQuery(this).toggleClass("collapsed");
    });
});
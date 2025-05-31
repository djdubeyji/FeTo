require(['jquery'], function (jQuery) {
    'use strict';

    jQuery(function () {
        // eslint-disable-line @atlassian/onready-checks/no-jquery-onready
        jQuery('#selectedLocale_select').change(function () {
            var myForm = jQuery(this).closest('form');
            myForm.attr('action', 'TranslateCustomField!default.jspa');
            myForm.attr('method', 'GET');
            myForm.submit();
            jQuery(':input').enable(false);
        });
    });
});
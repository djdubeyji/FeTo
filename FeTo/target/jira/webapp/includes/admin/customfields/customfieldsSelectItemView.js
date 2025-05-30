/**
 * Single select item
 */
define('jira/customfields/customfieldsSelectItemView', ['jira/marionette-4.1'], function (Marionette) {
    'use strict';

    return Marionette.View.extend({
        type: 'ITEM',
        ui: {
            option: '.customfield-filter-dropdown-item'
        },
        triggers: {
            'click @ui.option': 'option:selected'
        },
        template: JIRA.Templates.Admin.Customfields.selectDropdownItem
    });
});
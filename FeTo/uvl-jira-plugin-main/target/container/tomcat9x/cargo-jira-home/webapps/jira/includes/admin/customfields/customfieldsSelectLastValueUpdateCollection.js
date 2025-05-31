define('jira/customfields/customfieldsSelectLastValueUpdateCollection', ['jira/backbone-1.3.3', 'jira/moment', 'jira/util/formatter'], function (Backbone, moment, formatter) {
    'use strict';

    return Backbone.Collection.extend({
        name: 'lastValueUpdate',
        id: 'lastValueUpdate',
        initialize: function initialize() {
            this.add([{ name: formatter.I18n.getText('admin.issuefields.last.value.update.options.all') }, { name: formatter.I18n.getText('admin.issuefields.last.value.update.options.never'), value: -1 }, { name: formatter.I18n.getText('admin.issuefields.last.value.update.options.6months'), value: moment().subtract(6, 'months').endOf('day').valueOf() }, { name: formatter.I18n.getText('admin.issuefields.last.value.update.options.1year'), value: moment().subtract(1, 'year').endOf('day').valueOf() }, { name: formatter.I18n.getText('admin.issuefields.last.value.update.options.2years'), value: moment().subtract(2, 'years').endOf('day').valueOf() }, {
                name: 'calendar-input',
                label: formatter.I18n.getText('admin.issuefields.last.value.update.options.custom'),
                type: 'CALENDAR',
                value: null
            }]);
        }
    });
});
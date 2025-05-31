/**
 * This view renders calendar item for select dropdown view
 */
define('jira/customfields/customfieldsSelectItemCalendarView', ['jira/marionette-4.1', 'jira/moment', 'jira/util/data/meta', 'jira/moment/moment.jira.formatter'], function (Marionette, moment, meta, momentFmt) {
    'use strict';

    return Marionette.View.extend({
        type: 'CALENDAR',
        ui: {
            dateInput: '.customfields-calendar-input'
        },
        template: JIRA.Templates.Admin.Customfields.selectDropdownCalendarItem,
        /**
         * Render calendar widget
         */
        onRender: function onRender() {
            var _this = this;

            var MOMENT_FORMAT = momentFmt.translateSimpleDateFormat(meta.get('date-dmy'));
            this.getUI('dateInput').datePicker({
                overrideBrowserDefault: true,
                dateFormat: this.getDateFormat(),
                onSelect: function onSelect(dateString) {
                    _this.model.set({
                        name: dateString,
                        value: moment(dateString, MOMENT_FORMAT).endOf('day').valueOf()
                    });
                    _this.trigger('option:selected', _this);
                }
            });
        },
        /**
         * Make Look&Feel date format match jQuery UI format
         * https://aui.atlassian.com/aui/latest/docs/date-picker.html
         *
         * @return {String}
         */
        getDateFormat: function getDateFormat() {
            var momentFormat = momentFmt.translateSimpleDateFormat(meta.get('date-dmy'));
            return momentFormat.replace(/Y/g, 'y').replace(/yy/g, 'y').replace(/M/g, 'm').replace('mmm', 'M').replace(/D/g, 'd');
        },
        clearInput: function clearInput() {
            this.getUI('dateInput').val('');
        }
    });
});
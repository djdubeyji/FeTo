/**
 * This view is a container (acts as <aui-inline-dialog>) for select options
 */
define('jira/customfields/customfieldsSelectDropdownView', ['jira/marionette-4.1', 'jira/customfields/customfieldsSelectItemView', 'jira/customfields/customfieldsSelectItemCalendarView'], function (Marionette, CustomfieldsSelectItemView, CustomfieldsSelectItemCalendarView) {
    'use strict';

    return Marionette.CollectionView.extend({
        tagName: 'aui-inline-dialog',
        attributes: {
            alignment: 'bottom center'
        },
        className: 'customfields-select-dropdown',
        /**
         * Use calendar item view for calendar items
         * @param menuItemModel
         */
        childView: function childView(menuItemModel) {
            if (menuItemModel.get('type') === 'CALENDAR') {
                return CustomfieldsSelectItemCalendarView;
            }

            return CustomfieldsSelectItemView;
        },
        childViewEvents: {
            'option:selected': 'onChildviewOptionSelected'
        },
        onChildviewOptionSelected: function onChildviewOptionSelected(childView) {
            if (childView.type !== 'CALENDAR') {
                this.children.find(function (view) {
                    return view.type === 'CALENDAR';
                }).clearInput();
            }
            this.triggerMethod('option:selected', childView);
        }
    });
});
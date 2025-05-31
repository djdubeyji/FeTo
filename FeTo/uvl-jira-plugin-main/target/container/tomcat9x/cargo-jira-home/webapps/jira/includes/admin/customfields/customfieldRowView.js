/**
 * This view renders a custom field model (at the moment just a normal backbone model with data from server) as a table row
 */
define('jira/customfields/customfieldRowView', ['jira/marionette-4.1', 'jira/featureflags/feature-manager'], function (Marionette, FeatureManager) {
    'use strict';

    return Marionette.View.extend({
        tagName: 'tr',
        triggers: {
            'click .customfield-delete-trigger': 'delete:click'
        },
        attributes: function attributes() {
            return { 'data-custom-field-id': this.model.get('numericId') };
        },
        events: {
            'change .customfield-checkbox': 'onCheckboxChange'
        },
        initialize: function initialize() {
            this.listenTo(this.model, 'change:isSelected', this.onIsSelectedChange.bind(this));
        },
        template: function template(data) {
            return JIRA.Templates.Admin.Customfields.customfield({
                multiLingual: data.multiLingual,
                customfield: data,
                showUsageData: FeatureManager.isFeatureEnabled('jira.customfields.cleanup.identification'),
                showBulkCheckbox: FeatureManager.isFeatureEnabled('jira.customfields.bulk.delete'),
                useDeleteDialog: FeatureManager.isFeatureEnabled('jira.customfields.bulk.delete')
            });
        },
        templateContext: function templateContext() {
            return {
                multiLingual: this.getOption('isMultiLingual')
            };
        },
        onCheckboxChange: function onCheckboxChange() {
            this.model.set('isSelected', !this.model.get('isSelected'));
            this.trigger('checkbox:change');
        },
        onIsSelectedChange: function onIsSelectedChange() {
            if (this.model.get('isSelected')) {
                this.$el.find('.customfield-checkbox').prop('checked', true);
                this.$el.addClass('customfield-highlight');
            } else {
                this.$el.find('.customfield-checkbox').prop('checked', false);
                this.$el.removeClass('customfield-highlight');
            }
        }
    });
});
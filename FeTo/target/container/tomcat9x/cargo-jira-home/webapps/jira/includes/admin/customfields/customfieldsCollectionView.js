/**
 * This view is a container (acts as <table>) for a customfieldRow views (<tr>) per custom field in collection
 */
define('jira/customfields/customfieldCollectionView', ['jquery', 'jira/marionette-4.1', 'jira/analytics', 'jira/util/data/meta', 'jira/util/formatter', 'jira/customfields/customfieldRowView', 'jira/featureflags/feature-manager'], function ($, Marionette, analytics, meta, formatter, CustomfieldRowView, FeatureManager) {
    'use strict';

    return Marionette.CollectionView.extend({
        tagName: 'table',
        id: 'custom-fields-table',
        className: 'aui jira-sortable-table',
        template: JIRA.Templates.Admin.Customfields.customfieldsTableContent,
        templateContext: function templateContext() {
            return {
                showUsageData: FeatureManager.isFeatureEnabled('jira.customfields.cleanup.identification'),
                showBulkOperations: FeatureManager.isFeatureEnabled('jira.customfields.bulk.delete')
            };
        },
        childView: CustomfieldRowView,
        childViewContainer: 'tbody',
        childViewTriggers: {
            'delete:click': 'customfield:delete:click',
            'checkbox:change': 'customfield:checkbox:change'
        },
        childViewOptions: function childViewOptions() {
            return { isMultiLingual: meta.get('is-multilingual') };
        },

        events: {
            'click .sortable': 'onSortStart',
            'click .custom-fields-bulk-delete': 'onBulkDeleteClick',
            'change .custom-fields-bulk-checkbox': 'onBulkCheckboxChange'
        },
        onSortStart: function onSortStart(event) {
            var _this = this;

            this.trigger('sort:start');

            var _updateSorting = this.updateSorting(event),
                sortOrder = _updateSorting.sortOrder,
                sortColumn = _updateSorting.sortColumn;

            this.collection.filters.sortColumn = sortColumn;
            this.collection.filters.sortOrder = sortOrder;

            this.sendSortingAnalyticsEvent(sortColumn, sortOrder);
            this.collection.getFirstPage({ reset: true }).always(function () {
                _this.trigger('sort:end');
            }).fail(function (error) {
                return _this.triggerMethod('navigate:error', error);
            });
        },
        /**
         * In 8.15 we introduced sorting in some columns
         * @param {string|null} sortColumn
         * @param {string|null} sortOrder
         * @since 8.15
         */
        sendSortingAnalyticsEvent: function sendSortingAnalyticsEvent(sortColumn, sortOrder) {
            analytics.send({
                name: 'administration.customfields.sorted',
                properties: {
                    sortColumn: sortColumn || 'none',
                    sortOrder: sortOrder || 'none'
                }
            });
        },
        emptyView: Marionette.View.extend({
            tagName: 'tr',
            template: function template(data) {
                data.extraClasses = 'no-project-results';
                data.colspan = 5;
                data.name = formatter.I18n.getText('admin.issuefields.customfields.no.results.name');
                return JIRA.Templates.Common.emptySearchTableRow(data);
            }
        }),
        /**
         * This function returns next sorting order based on the general rule
         * @param order {string|null} current order.
         * @returns {string|null}
         */
        getNextSortOrder: function getNextSortOrder(order) {
            if (order === null) {
                return 'ascending';
            }

            if (order === 'ascending') {
                return 'descending';
            }

            return null;
        },
        /**
         * This function applies all UI changes, sets proper CSS and classes to table headers
         * @param sortOrder {string} sort order to be applied
         * @param sortColumn {string} currently sorted column
         */
        updateSortingUI: function updateSortingUI(sortOrder, sortColumn) {
            this.$('thead').replaceWith(JIRA.Templates.Admin.Customfields.customfieldsTableHeader({
                sortOrder: sortOrder,
                sortColumn: sortColumn,
                showBulkOperations: FeatureManager.isFeatureEnabled('jira.customfields.bulk.delete'),
                showUsageData: FeatureManager.isFeatureEnabled('jira.customfields.cleanup.identification')
            }));
        },
        /**
         * Set current sorting state and return the new value
         * @returns {{sortColumn: (string|null), sortOrder: (string|null)}}
         */
        updateSorting: function updateSorting(event) {
            var $header = $(event.currentTarget);
            var currentOrder = $header.data('sort-order') || null;

            var sortOrder = this.getNextSortOrder(currentOrder);
            var sortColumn = sortOrder ? $header.data('sort-key') : null;

            this.updateSortingUI(sortOrder, sortColumn);

            return {
                sortOrder: sortOrder,
                sortColumn: sortColumn
            };
        },
        onBulkDeleteClick: function onBulkDeleteClick() {
            this.trigger('bulk:deleteButton:click');
        },
        onBulkCheckboxChange: function onBulkCheckboxChange() {
            this.trigger('bulk:checkbox:change');
        }
    });
});
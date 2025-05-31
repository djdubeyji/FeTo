/**
 * This view renders the view custom field page
 * It initializes the pagable collection for custom fields, fetches the data from server and renders the (filters, table view and pagination) or empty message
 * depending on the number of custom fields
 */
define('jira/customfields/customfieldsView', ['jquery', 'jira/marionette-4.1', 'jira/dialog/error-dialog', 'jira/featureflags/feature-manager', 'jira/message', 'jira/customfields/customfieldsCollection', 'jira/customfields/customfieldCollectionView', 'jira/customfields/customfieldDeleteDialog', 'jira/customfields/customfieldsFilterView', 'jira/customfields/customfieldsPaginationDetailsView', 'jira/customfields/customfieldsPaginationView', 'jira/customfields/customfieldsRecalculationDetailsView'], function ($, Marionette, ErrorDialog, FeatureManager, Messages, Customfields, CustomfieldsCollectionView, DeleteDialog, FilterView, PaginationDetailsView, PaginationView, RecalculationDetailsView) {
    'use strict';

    return Marionette.View.extend({
        template: JIRA.Templates.Admin.Customfields.customfieldsPageContent,
        /*
         * When there are no custom fields on the instance we display an empty view here instead of inside the collection view,
         * Because there is no need to render the views outside the collction view such as filters, pagination etc
         * */
        getTemplate: function getTemplate() {
            if (!this.collection.length) {
                return JIRA.Templates.Admin.Customfields.customfieldsEmptyPageContent;
            }
            return this.template;
        },
        ui: {
            table: '#custom-fields-table',
            filters: '#custom-fields-filter',
            pagination: '#pagination-container',
            paginationDetails: '#pagination-details',
            recalculationDetails: '#recalculation-details',
            deleteDialog: '#customfield-delete-dialog-wrapper'
        },
        regions: {
            customfields: {
                el: '@ui.table',
                replaceElement: true
            },
            filters: {
                el: '@ui.filters'
            },
            pagination: '@ui.pagination',
            paginationDetails: '@ui.paginationDetails',
            recalculationDetails: '@ui.recalculationDetails',
            deleteDialog: '@ui.deleteDialog'
        },
        childViewEvents: {
            'navigate:start': 'onNavigationStart',
            'navigate:end': 'onNavigationEnd',
            'navigate:error': 'handleErrorResponse',
            'search:start': 'onNavigationStart',
            'search:end': 'onNavigationEnd',
            'sort:start': 'onNavigationStart',
            'sort:end': 'onNavigationEnd',
            'delete:refresh': 'refreshListAfterDelete',
            'customfield:delete:click': 'onCustomfieldDeleteClick',
            'customfield:checkbox:change': 'onCustomfieldCheckboxChange',
            'bulk:checkbox:change': 'onBulkCheckboxChange',
            'bulk:deleteButton:click': 'onBulkDeleteClick'
        },
        initialize: function initialize() {
            this.collection = new Customfields();
            this.fetchData().done(this.render.bind(this)).fail(this.handleErrorResponse.bind(this));
        },
        onRender: function onRender() {
            if (!this.collection.length) {
                // we rendered empty view
                return;
            }
            this.showChildView('customfields', new CustomfieldsCollectionView({
                collection: this.collection
            }));

            this.showChildView('filters', new FilterView({
                collection: this.collection
            }));

            this.showChildView('pagination', new PaginationView({
                collection: this.collection
            }));

            this.showChildView('paginationDetails', new PaginationDetailsView({
                collection: this.collection
            }));

            if (FeatureManager.isFeatureEnabled('jira.customfields.cleanup.identification')) {
                this.showChildView('recalculationDetails', new RecalculationDetailsView());
            }

            if (FeatureManager.isFeatureEnabled('jira.customfields.bulk.delete')) {
                this.showChildView('deleteDialog', new DeleteDialog({
                    collection: this.collection
                }));
            }

            this.updateBulkHeader();
            this.initTooltips();
        },
        onNavigationStart: function onNavigationStart() {
            this.displayLoadingIndicator();
        },
        onNavigationEnd: function onNavigationEnd() {
            this.updateBulkHeader();
            this.hideBulkHeader();
            this.hideLoadingIndicator();
        },
        onCustomfieldCheckboxChange: function onCustomfieldCheckboxChange() {
            var selectedCount = this.collection.where({ isSelected: true }).length;
            this.updateBulkHeader();

            if (selectedCount > 0) {
                this.showBulkHeader();
            } else {
                this.hideBulkHeader();
            }
        },
        /**
         * Display delete dialog for a custom field
         * @param {Backbone.View} customfieldRowView
         * @param {Backbone.Model} customfieldRowView.model
         * @since 8.16
         */
        onCustomfieldDeleteClick: function onCustomfieldDeleteClick(_ref) {
            var model = _ref.model;

            this.getRegion('deleteDialog').currentView.setModel(model);
            this.getRegion('deleteDialog').currentView.show();
        },
        onBulkCheckboxChange: function onBulkCheckboxChange() {
            var $checkbox = this.getTable().find('.custom-fields-bulk-checkbox');
            if ($checkbox.prop('checked')) {
                this.collection.getSelectableModels().forEach(function (customField) {
                    customField.set('isSelected', true);
                });
                this.showBulkHeader();
            } else {
                this.collection.resetDeleteData();
                this.hideBulkHeader();
            }
            this.updateBulkHeader();
        },
        onBulkDeleteClick: function onBulkDeleteClick() {
            this.getRegion('deleteDialog').currentView.show();
        },
        showBulkHeader: function showBulkHeader() {
            this.getTable().find('thead').addClass('custom-fields-header-bulk');
        },
        hideBulkHeader: function hideBulkHeader() {
            this.getTable().find('thead').removeClass('custom-fields-header-bulk');
        },
        updateBulkHeader: function updateBulkHeader() {
            var selectedCount = this.collection.where({ isSelected: true }).length;
            var selectableCount = this.collection.getSelectableModels().length;
            this.getTable().find('th.customfield-checkbox').html(JIRA.Templates.Admin.Customfields.bulkHeader({
                count: selectedCount,
                isChecked: selectedCount === selectableCount && selectableCount !== 0,
                isButtonDisabled: selectedCount === 0,
                isCheckboxDisabled: selectableCount === 0
            }));
        },
        fetchData: function fetchData() {
            this.displayLoadingIndicator();
            return this.collection.getFirstPage().done(this.hideLoadingIndicator.bind(this));
        },
        displayLoadingIndicator: function displayLoadingIndicator() {
            this.$el.addClass('active').find('.customfields-spinner').remove();
            this.$el.append("<aui-spinner class='customfields-spinner' size='large'></aui-spinner>");
        },
        hideLoadingIndicator: function hideLoadingIndicator() {
            this.$el.removeClass('active').find('.customfields-spinner').remove();
            this.initTooltips();
        },
        initTooltips: function initTooltips() {
            this.$('th .customfield-help-icon').tooltip({ gravity: 's' });
            this.$('tr td.customfield-name-cell .customfield-help-icon').tooltip();
            this.$('tr td.customfield-name-cell strong').tooltip();
            this.$('tr td.customfield-name-cell .customfield-lozenge').tooltip();
            this.$('tr td.customfield-name-cell div.description').tooltip({ html: true });
            this.$('tr td.customfield-last-value-update-cell span').tooltip();
        },
        /**
         * After delete, we want to reload the list
         */
        refreshListAfterDelete: function refreshListAfterDelete() {
            var _this = this;

            this.displayLoadingIndicator();
            this.collection.getFirstPage({ reset: true }).fail(function (error) {
                return _this.triggerMethod('navigate:error', error);
            }).done(this.onNavigationEnd.bind(this));
        },
        /**
         * Get cached reference to customfields table
         */
        getTable: function getTable() {
            return this.getRegion('customfields').currentView.$el;
        },
        handleErrorResponse: function handleErrorResponse(errorObj) {
            var status = errorObj.status,
                responseText = errorObj.responseText;

            var messages = this._parseResponse(responseText);

            var message = JIRA.Templates.Admin.Customfields.applicationAccessError({
                messages: messages,
                status: status
            });

            switch (status) {
                case 401:
                case 403:
                    var heading = JIRA.Templates.Admin.Customfields.applicationAccessErrorHeading({
                        status: status
                    });
                    this._showErrorDialogue(message, heading);
                    break;
                default:
                    this._showErrorMessage(message);
                    break;
            }
        },
        _parseResponse: function _parseResponse(responseText) {
            try {
                var errors = JSON.parse(responseText);
                var errorMessages = errors.errorMessages,
                    message = errors.message;


                if (errorMessages) {
                    return errorMessages;
                } else if (message) {
                    return [message];
                }
            } catch (e) {
                return null;
            }
        },

        _showErrorMessage: function _showErrorMessage(html) {
            Messages.showErrorMsg(html, {
                closeable: true
            });
        },

        _showErrorDialogue: function _showErrorDialogue(message, heading) {
            return new ErrorDialog({
                heading: heading,
                message: message,
                mode: 'warning'
            }).show();
        }
    });
});
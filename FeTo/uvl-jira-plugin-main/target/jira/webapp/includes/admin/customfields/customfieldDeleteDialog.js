/**
 * This view renders a custom field delete confirmation dialog.
 * This dialog is used for both single and bulk deletion.
 */
define('jira/customfields/customfieldDeleteDialog', ['jira/marionette-4.1', 'jira/analytics', 'jira/message', 'jira/ajs/ajax/smart-ajax', 'jira/util/formatter', 'underscore', 'wrm/context-path'], function (Marionette, analytics, Messages, SmartAjax, formatter, _, contextPath) {
    'use strict';

    var CUSTOMFIELDS_DELETE_ENDPOINT = contextPath() + '/rest/api/2/customFields';

    return Marionette.View.extend({
        template: JIRA.Templates.Admin.Customfields.deleteDialog,
        model: null, // Single deletion model
        ui: {
            submitButton: '.customfield-delete-dialog-submit',
            cancelButton: '.customfield-delete-dialog-cancel',
            closeButton: '.aui-close-button',
            spinner: '.customfield-delete-dialog-spinner',
            content: '.customfield-delete-dialog-content',
            header: '#customfield-delete-dialog-heading'
        },
        events: {
            'click @ui.submitButton': 'onSubmitClick',
            'click @ui.cancelButton': 'hide',
            'click @ui.closeButton': 'hide',
            'show': 'onShow',
            'hide': 'onHide'
        },
        initialize: function initialize() {
            this.boundOnBeforeHide = this.onBeforeHide.bind(this);
        },
        onRender: function onRender() {
            this.unwrapTemplate();
            this.dialog = AJS.dialog2(this.el).on('show', this.onShow.bind(this)).on('hide', this.onHide.bind(this));
        },
        show: function show() {
            this.dialog.show();
        },
        hide: function hide() {
            this.dialog.hide();
        },
        showSpinner: function showSpinner() {
            this.getUI('spinner').removeClass('hidden');
        },
        hideSpinner: function hideSpinner() {
            this.getUI('spinner').addClass('hidden');
        },
        enableSubmitButton: function enableSubmitButton() {
            this.getUI('submitButton').prop('disabled', false);
        },
        disableSubmitButton: function disableSubmitButton() {
            this.getUI('submitButton').prop('disabled', true);
        },
        disableHiding: function disableHiding() {
            this.getUI('cancelButton').prop('disabled', true);
            this.getUI('closeButton').prop('disabled', true);
            this.$el.attr('data-aui-modal', true);
            this.dialog.on('beforeHide', this.boundOnBeforeHide);
        },
        enableHiding: function enableHiding() {
            this.getUI('cancelButton').prop('disabled', false);
            this.getUI('closeButton').prop('disabled', false);
            this.$el.removeAttr('data-aui-modal');
            this.dialog.off('beforeHide', this.boundOnBeforeHide);
        },
        /**
         * If model is set, we want to perform single deletion
         * @param model {Backbone.Model|null} - custom field model to be removed
         */
        setModel: function setModel(model) {
            this.model = model;
        },
        isSingleDelete: function isSingleDelete() {
            return this.getSelectedModels().length === 1;
        },
        /**
         * Dialog displays different copy for single and bulk deletion.
         * If we've got only one model to bulk delete, we want single deletion copy.
         * @returns {null|Backbone.Model}
         */
        getSingleDeleteModel: function getSingleDeleteModel() {
            if (this.model) {
                return this.model;
            }
            return this.collection.findWhere({ isSelected: true });
        },
        /**
         * @returns {Array}
         */
        getSelectedModels: function getSelectedModels() {
            if (this.model) {
                return [this.model];
            }
            return this.collection.where({ isSelected: true });
        },
        /**
         * Clear bulk selection
         */
        resetDeleteData: function resetDeleteData() {
            this.collection.resetDeleteData();
        },
        sendAnalyticsEvent: function sendAnalyticsEvent() {
            if (this.isSingleDelete()) {
                this.sendSingleDeleteAnalyticsEvent();
            } else {
                this.sendBulkDeleteAnalyticsEvent();
            }
        },
        sendSingleDeleteAnalyticsEvent: function sendSingleDeleteAnalyticsEvent() {
            var customField = this.getSingleDeleteModel();
            analytics.send({
                name: 'administration.customfields.deleted',
                properties: {
                    fieldId: customField.get('numericId'),
                    issuesWithValue: customField.get('issuesWithValue'),
                    lastUpdateDate: customField.get('lastValueUpdate'),
                    numberOfProjects: customField.get('projectsCount'),
                    numberOfScreens: customField.get('screensCount')
                }
            });
        },
        sendBulkDeleteAnalyticsEvent: function sendBulkDeleteAnalyticsEvent() {
            this.getSelectedModels().forEach(function (customField) {
                analytics.send({
                    name: 'administration.customfields.bulk.deleted',
                    properties: {
                        fieldId: customField.get('numericId'),
                        issuesWithValue: customField.get('issuesWithValue'),
                        lastUpdateDate: customField.get('lastValueUpdate'),
                        numberOfProjects: customField.get('projectsCount'),
                        numberOfScreens: customField.get('screensCount')
                    }
                });
            });
        },
        /**
         * @param meta {Object} - information about custom fields deletion status
         * @param meta.deletedCustomFieldsCount
         * @param meta.notDeletedCustomFieldsCount
         */
        showSuccessMessage: function showSuccessMessage(_ref) {
            var deletedCustomFieldsCount = _ref.deletedCustomFieldsCount,
                notDeletedCustomFieldsCount = _ref.notDeletedCustomFieldsCount;

            if (deletedCustomFieldsCount === 1) {
                Messages.showSuccessMsg(formatter.I18n.getText('admin.issuefields.customfields.delete.single.success', _.escape(this.getSingleDeleteModel().get('name'))), {
                    closeable: false
                });
            } else {
                Messages.showSuccessMsg(formatter.I18n.getText('admin.issuefields.customfields.delete.bulk.success', deletedCustomFieldsCount), {
                    closeable: false
                });
            }
            if (notDeletedCustomFieldsCount > 0) {
                Messages.showErrorMsg(JIRA.Templates.Admin.Customfields.message({
                    title: formatter.I18n.getText('admin.issuefields.customfields.delete.error.some.title'),
                    description: formatter.I18n.getText('admin.issuefields.customfields.delete.error.some.description')
                }), {
                    closeable: false
                });
            }
        },
        /**
         * Show notification depending on error code
         * 400 - no fields were deleted (null, locked or other reason)
         * 423 - unsuccessful lock (most likely other call is in progress)
         * 500 - internal server error
         * 503 - server license or feature flag disabled
         * @param status {Number}
         */
        showErrorMessage: function showErrorMessage(status) {
            var title = formatter.I18n.getText('rest.error.internal');
            var description = '';
            switch (status) {
                case 400:
                    title = formatter.I18n.getText('admin.issuefields.customfields.delete.error.zero.title');
                    description = formatter.I18n.getText('admin.issuefields.customfields.delete.error.zero.description');
                    break;
                case 423:
                    title = formatter.I18n.getText('admin.issuefields.customfields.delete.error.clusterlock.title');
                    description = formatter.I18n.getText('admin.issuefields.customfields.delete.error.clusterlock.description');
                    break;
                case 503:
                    title = formatter.I18n.getText('admin.issuefields.customfields.delete.error.settings.title');
                    description = formatter.I18n.getText('admin.issuefields.customfields.delete.error.settings.description');
                    break;
            }

            Messages.showErrorMsg(JIRA.Templates.Admin.Customfields.message({
                title: title,
                description: description
            }), {
                closeable: false
            });
        },
        /**
         * Set copy of the delete dialog to match selection.
         */
        onShow: function onShow() {
            var deleteCount = this.getSelectedModels().length;
            this.getUI('content').html(JIRA.Templates.Admin.Customfields.deleteDialogContent({
                count: deleteCount,
                name: this.isSingleDelete() ? this.getSingleDeleteModel().get('name') : deleteCount
            }));

            this.getUI('header').html(formatter.I18n.getText('admin.issuefields.customfields.delete.bulk.header', this.getSelectedModels().length));
        },
        /**
         * Remove single delete model, so that it does not override bulk deletion
         */
        onHide: function onHide() {
            this.setModel(null);
        },
        /**
         * Prevent hiding the dialog if the deletion is in progress
         * @param event
         */
        onBeforeHide: function onBeforeHide(event) {
            event.preventDefault();
        },
        onSubmitClick: function onSubmitClick() {
            var _this = this;

            this.showSpinner();
            this.disableSubmitButton();
            this.disableHiding();
            this.sendAnalyticsEvent();

            SmartAjax.makeRequest({
                url: CUSTOMFIELDS_DELETE_ENDPOINT + '?ids=' + this.getSelectedModels().map(function (customField) {
                    return customField.id;
                }).join('&ids='),
                method: 'DELETE',
                timeout: 0, // no timeout
                /**
                 * @param response
                 * @param response.deletedCustomFields {Array} - array of deleted custom field ids
                 * @param response.notDeletedCustomFields {Array} - array of not deleted custom field ids
                 */
                success: function success(_ref2) {
                    var deletedCustomFields = _ref2.deletedCustomFields,
                        notDeletedCustomFields = _ref2.notDeletedCustomFields;

                    _this.trigger('delete:refresh');
                    _this.showSuccessMessage({
                        deletedCustomFieldsCount: deletedCustomFields ? deletedCustomFields.length : 0,
                        notDeletedCustomFieldsCount: Object.keys(notDeletedCustomFields || {}).length
                    });
                    _this.resetDeleteData();
                },
                error: function error(_ref3) {
                    var status = _ref3.status;
                    return _this.showErrorMessage(status);
                },
                complete: function complete() {
                    _this.enableHiding();
                    _this.hide();
                    _this.hideSpinner();
                    _this.enableSubmitButton();
                }
            });
        }
    });
});
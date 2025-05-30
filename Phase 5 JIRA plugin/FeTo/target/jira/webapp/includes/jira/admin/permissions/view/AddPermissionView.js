define('jira/project/permissions/addpermissionview', ['jira/util/formatter', 'jira/backbone-1.3.3', 'jquery', 'underscore', 'jira/project/permissions/addgrantcollectionview', 'jira/project/permissions/securitytypes', 'wrm/context-path'], function (formatter, Backbone, $, _, AddGrantCollectionView, SecurityTypes, wrmContextPath) {
    "use strict";

    /**
     * Representation the Add Permission View
     * */

    return Backbone.View.extend({
        events: {
            "submit #grant-permission-form": "_submitDialog",
            "click #grant-permission-dialog-grant-button": "_submitDialog",
            "click #grant-permission-dialog-close-button": "close",
            "change #permission-target-select": "_handlePermissionTargetSelect",
            "click #security-type-list-more-opts-btn": "_handleSecurityTypeToggleClick"
        },

        initialize: function initialize(attributes) {
            this.permissionSchemeId = this.model.get("permissionSchemeId");
            this.schemeModel = attributes.schemeModel;

            this.listenToOnce(this.model, "change:grantCollection", this.render);
            this.listenTo(this.model, "change:showMore", this._toggleShowMore);
            this.listenTo(this.model, "change:submitDisabled", this._handleSubmitDisabled);
            this.addDialog = AJS.dialog2(this.$el);
        },

        /**
         * Opens and render the content of the dialog
         */
        open: function open() {
            this.addDialog.show();
            this.addDialog.on("hide", _.bind(this._close, this));
            this.render();
        },

        /**
         * Render the content of the dialog. If the model is not populated a loading spinner is displayed while
         * it waits for the content.
         */
        render: function render() {
            this.model.set("submitDisabled", true);
            var grantCollection = this.model.get("grantCollection");
            //If it has loaded the data yet.
            if (grantCollection) {
                this.$("#grant-permission-dialog-content").empty();
                grantCollection.on("change:selected change:securityTypeParamVal", _.bind(this._handleSecurityTypeSelected, this));

                this._renderPermissionTargetSelect();
                this._renderSecurityTypeList();

                this.trigger("contentLoaded");
            } else {
                this._renderLoadingSpinner();
            }
        },

        /**
         * Closes the dialog
         */
        close: function close() {
            this.addDialog.remove();
            this._close();
        },

        /**
         * this view related close handler
         */
        _close: function _close() {
            this.remove();
            this._removeInfoInlineDialogs();
        },

        _renderLoadingSpinner: function _renderLoadingSpinner() {
            this.$("#grant-permission-dialog-content").html(JIRA.Templates.AddProjectPermission.loadingSpinner());
        },

        /**
         * Removes any grant permission info inline dialogs. For some reason not doing this results
         * in the next creation to be aligned to the top left of the page.
         */
        _removeInfoInlineDialogs: function _removeInfoInlineDialogs() {
            $(".grant-permission-inline-dialog").remove();
        },

        _handleSubmitStateAndSecurityWarningMessage: function _handleSubmitStateAndSecurityWarningMessage() {
            var selectedPermissionType = this.model.get("grantCollection").getSelectedModel();
            var permissions = this.permissionTargetSelect.val();
            this._showSecurityWarningIfApplicable(permissions, selectedPermissionType);
            if (permissions && selectedPermissionType != null && selectedPermissionType.isValid() && this.grantsView.isSelectedVisible()) {
                this.model.set("submitDisabled", false);
            } else {
                this.model.set("submitDisabled", true);
            }
        },

        _handlePermissionTargetSelect: function _handlePermissionTargetSelect() {
            this._handleSubmitStateAndSecurityWarningMessage();
        },

        _handleSecurityTypeSelected: function _handleSecurityTypeSelected() {
            this._handleSubmitStateAndSecurityWarningMessage();
        },

        _showSecurityWarningIfApplicable: function _showSecurityWarningIfApplicable(permissions, grantedTo) {
            var dialogSecurityWarning = this.$('#grant-permission-dialog-security-warning');
            if (!permissions || !grantedTo) {
                dialogSecurityWarning.attr('hidden', '');
                return;
            }
            var ANYONE_PARAM_VALUE = '';

            var securityType = grantedTo.get('securityType');
            var securityTypeParamVal = grantedTo.get('securityTypeParamVal') || [ANYONE_PARAM_VALUE];

            var riskyPermissionSelected = permissions.includes('BROWSE_PROJECTS');
            var anyoneOnTheWebSelected = SecurityTypes.GROUP === securityType && securityTypeParamVal.includes(ANYONE_PARAM_VALUE);
            var showWarning = riskyPermissionSelected && anyoneOnTheWebSelected;

            dialogSecurityWarning.attr('hidden', showWarning ? null : '');
        },

        _toggleShowMore: function _toggleShowMore(model, showMore) {
            if (showMore) {
                this.showMoreBtn.text(formatter.I18n.getText('admin.permission.project.security.types.less'));
                this.$(".secondary").show();
            } else {
                this.showMoreBtn.text(formatter.I18n.getText('admin.permission.project.security.types.more'));
                this.$(".secondary").hide();
            }

            this._handleSubmitStateAndSecurityWarningMessage();
        },

        _handleSecurityTypeToggleClick: function _handleSecurityTypeToggleClick(e) {
            e.preventDefault();
            this.model.toggleShowMore();
        },

        _submitDialog: function _submitDialog(e) {
            e.preventDefault();
            if (!this.model.get("submitDisabled")) {
                this._disableAllFields();

                var grant = this.model.get("grantCollection").getSelectedData();
                if (grant !== null) {
                    var permissions = this.permissionTargetSelect.val();
                    $.ajax({
                        url: wrmContextPath() + "/rest/internal/2/managedpermissionscheme/" + this.permissionSchemeId,
                        type: "POST",
                        data: JSON.stringify({
                            permissionKeys: permissions,
                            grants: [grant]
                        }),
                        contentType: "application/json",
                        success: function (response) {
                            this.trigger("permissionGranted", response);
                            this.addDialog.remove();
                        }.bind(this),
                        error: function (response) {
                            response = response.responseText ? JSON.parse(response.responseText) : {};
                            this.trigger("grantPermissionError", response);
                            this._enableAllFields();
                        }.bind(this)
                    });
                }
            }
        },

        _disableAllFields: function _disableAllFields() {
            // auiSelect2 doesn't play nice when disabled - it increases the padding for any selected elements and this
            // affects the overall positioning of elements around it. Changing the opacity is enough here
            this.permissionTargetSelect.auiSelect2('container').css('opacity', 0.7);

            this.$el.find('input').not('select2-input').attr('aria-disabled', 'true').attr('disabled', 'disabled');
            this.model.set('submitDisabled', true);
        },

        _enableAllFields: function _enableAllFields() {
            this.permissionTargetSelect.auiSelect2('container').css('opacity', 1);
            this.$el.find('input').not('select2-input').attr('aria-disabled', 'false').removeAttr('disabled');
            this.model.set('submitDisabled', false);
        },

        _renderSecurityTypeList: function _renderSecurityTypeList() {
            this.grantsView = new AddGrantCollectionView({ collection: this.model.get("grantCollection") }).render();
            this.$("#grant-permission-form .field-group").after(this.grantsView.$el);

            this.showMoreBtn = this.$("#security-type-list-more-opts-btn");
        },

        _renderPermissionTargetSelect: function _renderPermissionTargetSelect() {
            var permissions = this.schemeModel.get("permissions").toJSON();
            this.$("#grant-permission-dialog-content").html(JIRA.Templates.AddProjectPermission.renderPermissionTargetSelect({
                selectedPermission: this.model.get("permissionKey"),
                data: permissions
            }));

            this.permissionTargetSelect = this.$("#permission-target-select");
            this.permissionTargetSelect.auiSelect2();
        },

        _handleSubmitDisabled: function _handleSubmitDisabled(model, disabled) {
            this.$("#grant-permission-dialog-grant-button").attr("aria-disabled", disabled);
        }
    });
});
/**
 * Initializes the terminology help dialog and extends it's trigger (the terminology help dropdown item) in Jira header help menu with lozenge
 **/
require(['jira/data/local-storage', 'jira/dialog/dialog-register', 'jira/dialog/dialog-util', 'jira/dialog/form-dialog', 'jira/terminology-feature-service', 'jira/util/formatter', 'jira/util/init-on-dcl', 'jquery'], function (jiraLocalStorage, DialogRegister, DialogUtil, FormDialog, terminologyFeatureService, formatter, initOnDCL, $) {
    'use strict';

    initOnDCL(function () {
        var triggerClicked = jiraLocalStorage.getItem('jira.terminology.help.clicked');
        var helpDismissed = jiraLocalStorage.getItem('jira.terminology.help.dismissed');
        var $terminologyHelpTrigger = $('#terminology_help');

        if (helpDismissed || !terminologyFeatureService.isEnglishLocale()) {
            /* remove the dropdown list item if help is dismissed by user previously
             * @TODO use user preferences and web-item condition for this
             */
            $terminologyHelpTrigger.parent('li').remove();
            return;
        }

        DialogRegister.terminologyHelp = new FormDialog({
            id: 'terminology-help-dialog',
            trigger: '#terminology_help',
            widthClass: 'medium',
            ajaxOptions: DialogUtil.getDefaultAjaxOptions,
            defineResources: function defineResources() {
                this.requireResource('jira.webresources:terminology-help-dialog');
            }
        });

        DialogRegister.terminologyHelp.onContentReady(function () {
            var _this = this;

            this.get$popupContent().find('#terminology-dismiss-btn').on('click', function () {
                jiraLocalStorage.setItem('jira.terminology.help.dismissed', true);
                _this.hide();
                $terminologyHelpTrigger.parent('li').remove(); // immediately remove the help dropdown list item
            });
        });

        if (triggerClicked) {
            return;
        }
        var $newLozenge = $('<span class="aui-lozenge aui-lozenge-subtle aui-lozenge-new">' + formatter.I18n.getText('jira.terminology.help.new') + '</span>').css('margin-left', '5px') // too lazy to make a css file just for this :notsureif:
        .appendTo($terminologyHelpTrigger);
        $terminologyHelpTrigger.on('click', function () {
            jiraLocalStorage.setItem('jira.terminology.help.clicked', true);
            $newLozenge.remove();
        });
    });
});
define('jira/field/init-version-pickers', ['jira/field/version-picker', 'jira/util/formatter', 'jira/util/events', 'jira/util/events/types', 'jira/util/events/reasons', 'jira/searchers/element/version-picker-options', 'jira/searchers/element/common-pickers-config', 'jquery'], function (VersionPicker, formatter, Events, Types, Reasons, versionPickerOptions, commonPickersConfig, jQuery) {
    'use strict';

    function createPicker($context, $selectField, index) {
        function getActiveProjectId($context, selectField, index) {
            var $project = $context.find('.project-field, .project-field-readonly');

            return $project.length > 1 ? $project.eq(index - 1).val() : selectField.dataset.projectId;
        }

        var options = void 0;
        var selectField = $selectField[0];
        var commonOptions = {
            element: $selectField,
            itemAttrDisplayed: 'label',
            removeOnUnSelect: false,
            submitInputVal: true,
            errorMessage: formatter.I18n.getText("jira.ajax.autocomplete.versions.error"),
            maxInlineResultsDisplayed: commonPickersConfig.DEFAULT_MAX_RESULTS,
            expandAllResults: true
        };

        if (selectField.dataset.useRestEndpoint) {
            var projectId = getActiveProjectId($context, selectField, index);

            if (projectId) {
                commonOptions.baseAjaxOptions = {
                    projectIds: projectId
                };
            }

            options = versionPickerOptions(commonOptions);
        } else {
            options = commonOptions;
        }

        new VersionPicker(options);
    }

    function locateSelect(parent) {
        var $parent = jQuery(parent);
        var $selectField;

        if ($parent.is("select")) {
            $selectField = $parent;
        } else {
            $selectField = $parent.find("select");
        }

        return $selectField;
    }

    function findVersionSelectAndConvertToPicker($context, selector) {
        selector = selector || ".aui-field-versionspicker.frother-control-renderer";
        jQuery(selector, $context).each(function (i) {
            var $selectField = locateSelect(this);
            if ($selectField.length) {
                createPicker($context, $selectField, i);
            }
        });
    }

    Events.bind(Types.NEW_CONTENT_ADDED, function (e, context, reason) {
        //eslint-disable-line @atlassian/jira-event-checks/no-newcontentadded-handlers
        if (reason !== Reasons.panelRefreshed) {
            findVersionSelectAndConvertToPicker(context);
        }
    });
});
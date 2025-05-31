define('jira/field/init-component-pickers', ['jira/field/component-picker', 'jira/util/formatter', 'jira/util/events', 'jira/util/events/types', 'jira/util/events/reasons', 'jira/searchers/element/component-picker-options', 'jquery'], function (ComponentPicker, formatter, Events, Types, Reasons, componentPickerOptions, jQuery) {
    'use strict';

    function createPicker($context, $selectField, index) {
        function getActiveProjectId($context, selectField, index) {
            var $project = $context.find(".project-field, .project-field-readonly");

            return $project.length > 1 ? $project.eq(index - 1).val() : selectField.dataset.projectId;
        }

        var options = void 0;
        var selectField = $selectField[0];
        var commonOptions = {
            element: $selectField,
            itemAttrDisplayed: "label",
            errorMessage: formatter.I18n.getText("jira.ajax.autocomplete.components.error"),
            expandAllResults: true
        };

        if (selectField.dataset.useRestEndpoint) {
            commonOptions.baseAjaxOptions = {
                useIdPrefixInValue: false
            };

            var projectId = getActiveProjectId($context, selectField, index);
            if (projectId) {
                commonOptions.baseAjaxOptions.projectIds = projectId;
            }

            options = componentPickerOptions(commonOptions);
        } else {
            options = commonOptions;
        }

        new ComponentPicker(options);
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

    var DEFAULT_SELECTORS = ["div.aui-field-componentspicker.frother-control-renderer", // aui forms
    "td.aui-field-componentspicker.frother-control-renderer", // convert to subtask and move
    "tr.aui-field-componentspicker.frother-control-renderer" // bulk edit
    ];

    function findComponentSelectAndConvertToPicker($context, selector) {

        selector = selector || DEFAULT_SELECTORS.join(", ");

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
            findComponentSelectAndConvertToPicker(context);
        }
    });
});
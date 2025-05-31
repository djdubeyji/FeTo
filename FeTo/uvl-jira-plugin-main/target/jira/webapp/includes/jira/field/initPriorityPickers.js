define('jira/field/init-priority-pickers', ['jira/ajs/select/single-select', 'jira/util/events/reasons', 'jira/util/events/types', 'jira/util/events', 'jira/searchers/element/priority-picker-options', 'jquery'], function (SingleSelect, Reasons, Types, Events, priorityPickerOptions, $) {
    'use strict';

    function getActiveProjectId($context, el, index) {
        var $project = $context.find(".project-field, .project-field-readonly");

        return $project.length > 1 ? $project.eq(index - 1).val() : el.dataset.projectId;
    }

    function createPriorityPicker($context) {
        $context.find("select#priority").each(function (i, el) {
            var options = {
                element: el,
                revertOnInvalid: true
            };

            var ariaLabel = $.attr(el, 'aria-label');
            if (ariaLabel) {
                options.ariaLabel = ariaLabel;
            }

            if (el.dataset.useRestEndpoint) {
                var projectId = getActiveProjectId($context, el, i);

                if (projectId) {
                    options.baseAjaxOptions = {
                        projectIds: projectId
                    };
                }

                new SingleSelect(priorityPickerOptions(options));
            } else {
                new SingleSelect(options);
            }
        });
    }

    Events.bind(Types.NEW_CONTENT_ADDED, function (e, context, reason) {
        //eslint-disable-line @atlassian/jira-event-checks/no-newcontentadded-handlers
        if (reason !== Reasons.panelRefreshed) {
            createPriorityPicker(context);
        }
    });
});
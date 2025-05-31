define('jira/searchers/element/priority-sparkler', ['jira/ajs/select/checkbox-multi-select', 'jira/searchers/element/priority-picker-options', 'jira/searchers/element/common-pickers-utils', 'jira/skate'], function (CheckboxMultiSelect, priorityPickerOptions, commonPickersUtils, skate) {
    'use strict';

    return skate('js-default-checkboxmultiselectpriority', {
        type: skate.type.CLASSNAME,
        created: function checkboxMultiSelectCreated(element) {
            var options = {
                element: element,
                content: 'mixed',
                baseAjaxOptions: {
                    projectIds: commonPickersUtils.getSelectedProjectsIds()
                }
            };

            new CheckboxMultiSelect(priorityPickerOptions(options));
        }
    });
});

require(['jira/searchers/element/priority-sparkler']);
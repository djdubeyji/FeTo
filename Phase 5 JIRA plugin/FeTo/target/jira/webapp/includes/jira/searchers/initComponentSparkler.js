define('jira/searchers/element/component-sparkler', ['jira/ajs/select/checkbox-multi-select', 'jira/searchers/element/component-picker-options', 'jira/skate', 'jira/searchers/element/common-pickers-utils'], function (CheckboxMultiSelect, componentPickerOptions, skate, commonPickersUtils) {
    'use strict';

    return skate('js-default-checkboxmultiselectcomponent', {
        type: skate.type.CLASSNAME,
        created: function checkboxMultiSelectCreated(element) {
            var options = {
                element: element,
                content: 'mixed',
                baseAjaxOptions: {
                    projectIds: commonPickersUtils.getSelectedProjectsIds(),
                    useIdPrefixInValue: true
                }
            };

            new CheckboxMultiSelect(componentPickerOptions(options));
        }
    });
});

require(['jira/searchers/element/component-sparkler']);
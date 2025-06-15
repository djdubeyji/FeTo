define('jira/searchers/element/version-sparkler', ['jira/ajs/select/checkbox-multi-select', 'jira/searchers/element/version-picker-options', 'jira/skate', 'jira/searchers/element/common-pickers-utils'], function (CheckboxMultiSelect, versionPickerOptions, skate, commonPickerUtils) {
    'use strict';

    return skate('js-default-checkboxmultiselectversion', {
        type: skate.type.CLASSNAME,
        created: function checkboxMultiSelectCreated(element) {
            var options = {
                element: element,
                content: 'mixed',
                baseAjaxOptions: {
                    projectIds: commonPickerUtils.getSelectedProjectsIds(),
                    useIdPrefixInValue: true
                }
            };

            new CheckboxMultiSelect(versionPickerOptions(options));
        }
    });
});

require(['jira/searchers/element/version-sparkler']);
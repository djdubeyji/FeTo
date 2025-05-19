/**
 * Initializes checkbox multi select for following custom field types: multi, select, checkbox, radio as defined by
 * "Multi Select Searcher" custom field searcher.
 *
 * @module jira/searchers/element/multi-select-custom-field-sparkler
 */
define('jira/searchers/element/multi-select-custom-field-sparkler', ['jira/ajs/select/checkbox-multi-select', 'jira/searchers/element/common-pickers-utils', 'jira/searchers/element/multi-select-custom-field-picker-options', 'jira/skate'], function (CheckboxMultiSelect, commonPickersUtils, multiSelectCustomFieldPickerOptions, skate) {
    'use strict';

    return skate('js-default-checkboxmultiselect-custom-field', {
        type: skate.type.CLASSNAME,
        created: function created(element) {
            var options = {
                element: element,
                content: 'mixed',
                baseAjaxOptions: {
                    customFieldId: parseInt(element.dataset.customFieldId, 10),
                    projectIds: commonPickersUtils.getSelectedProjectsIds(),
                    issueTypeIds: commonPickersUtils.getSelectedIssueTypeIds()
                }
            };

            var ariaLabel = element.getAttribute('aria-label');
            if (ariaLabel) {
                options.ariaLabel = ariaLabel;
            }

            new CheckboxMultiSelect(multiSelectCustomFieldPickerOptions(options));
        }
    });
});

require(['jira/searchers/element/multi-select-custom-field-sparkler']);
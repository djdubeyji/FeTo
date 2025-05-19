define('jira/searchers/element/sparkler', ['jira/ajs/select/checkbox-multi-select', 'jira/skate', 'jquery'], function (CheckboxMultiSelect, skate, $) {
    'use strict';

    return skate("js-default-checkboxmultiselect", {
        type: skate.type.CLASSNAME,
        created: function checkboxMultiSelectCreated(element) {
            var options = { element: element };
            var ariaLabel = $.attr(element, 'aria-label');
            if (ariaLabel) {
                options.ariaLabel = ariaLabel;
            }
            new CheckboxMultiSelect(options);
        }
    });
});

require(["jira/searchers/element/sparkler"]);
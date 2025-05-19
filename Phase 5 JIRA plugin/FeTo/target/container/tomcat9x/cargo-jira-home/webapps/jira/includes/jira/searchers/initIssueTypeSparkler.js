define('jira/searchers/element/issuetype-sparkler', ['jira/ajs/select/checkbox-multi-select', 'jira/skate', 'jquery', 'jira/searchers/element/issuetype-picker-options'], function (CheckboxMultiSelect, skate, $, issueTypePickerOptions) {
    'use strict';

    return skate('js-issuetype-checkboxmultiselect', {
        type: skate.type.CLASSNAME,
        created: function created(element) {
            var options = {
                element: element,
                content: 'mixed'
            };

            var ariaLabel = $.attr(element, 'aria-label');
            if (ariaLabel) {
                options.ariaLabel = ariaLabel;
            }

            new CheckboxMultiSelect(issueTypePickerOptions(options));
        }
    });
});

define('jira/searchers/element/issuetype-picker-options', ['wrm/context-path', 'jira/util/formatter', 'jira/ajs/list/item-descriptor', 'jira/ajs/list/group-descriptor', 'jira/searchers/element/common-pickers-config'], function (contextPath, formatter, ItemDescriptor, GroupDescriptor, commonPickersConfig) {
    'use strict';

    var getAjaxOptions = function getAjaxOptions() {
        return {
            url: contextPath() + '/rest/api/2/issuetype/page',
            data: {
                maxResults: commonPickersConfig.DEFAULT_MAX_RESULTS
            },

            formatResponse: function formatResponse(data) {
                var items = data.values.map(function (issueType) {
                    return new ItemDescriptor({
                        value: issueType.id,
                        label: issueType.name,
                        icon: issueType.iconUrl,
                        allowDuplicate: false,
                        highlighted: true
                    });
                });

                var notShownItemsNumber = data.total - items.length;
                var footerText = notShownItemsNumber > 0 ? formatter.I18n.getText('common.concepts.too.many.matches', notShownItemsNumber) : undefined;
                return [new GroupDescriptor({ items: items, footerText: footerText, fetchedThroughAjaxCall: true })];
            }
        };
    };

    return function (options) {
        return Object.assign({}, options, {
            maxInlineResultsDisplayed: commonPickersConfig.DEFAULT_MAX_RESULTS,
            maxResultsDisplayedPerGroup: commonPickersConfig.DEFAULT_MAX_RESULTS_PER_GROUP,
            ajaxOptions: getAjaxOptions(options.baseAjaxOptions)
        });
    };
});

require(['jira/searchers/element/issuetype-sparkler', 'jira/searchers/element/issuetype-picker-options']);
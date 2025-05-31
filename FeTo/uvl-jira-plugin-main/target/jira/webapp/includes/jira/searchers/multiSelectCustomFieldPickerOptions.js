define('jira/searchers/element/multi-select-custom-field-picker-options', ['wrm/context-path', 'jira/util/formatter', 'jira/ajs/list/item-descriptor', 'jira/ajs/list/group-descriptor', 'jira/searchers/element/common-pickers-config'], function (contextPath, formatter, ItemDescriptor, GroupDescriptor, commonPickersConfig) {
    'use strict';

    /**
     * @param {Object} baseAjaxOptions
     * @param {number} baseAjaxOptions.customFieldId: Extracted from DOM custom field ID in form 'customfield_XXXX'
     * @param {string[]} baseAjaxOptions.projectIds: Selected project IDs
     * @param {string[]} baseAjaxOptions.issueTypeIds: Selected issue type IDs
     */

    var getAjaxOptions = function getAjaxOptions(baseAjaxOptions) {
        var data = { maxResults: commonPickersConfig.DEFAULT_MAX_RESULTS };

        if (baseAjaxOptions.projectIds) {
            data.projectIds = baseAjaxOptions.projectIds;
        }

        if (baseAjaxOptions.issueTypeIds) {
            data.issueTypeIds = baseAjaxOptions.issueTypeIds;
        }

        return {
            url: contextPath() + '/rest/api/latest/customFields/' + baseAjaxOptions.customFieldId + '/options',
            data: data,
            /** Formats the data retrieved from the server. Option's ID is mapped to a string to avoid duplicate values
             *  when querying for suggestions during filtering.
             *
             * @param {Object} data
             * @param {number} data.total - Total number of matching options found by the server
             * @param {{id: number, value: string}[]} data.options - List of actual options returned by the server
             * @returns {GroupDescriptor[]}
             */
            formatResponse: function formatResponse(data) {
                var items = data.options.map(function (option) {
                    return new ItemDescriptor({
                        value: option.id.toString(),
                        label: option.value,
                        title: option.value,
                        allowDuplicate: false,
                        highlighted: false
                    });
                });

                var notShownItemsNumber = data.total - items.length;
                var footerText = notShownItemsNumber > 0 ? formatter.I18n.getText('common.concepts.too.many.matches', notShownItemsNumber) : undefined;
                return [new GroupDescriptor({ items: items, footerText: footerText, fetchedThroughAjaxCall: true })];
            }
        };
    };

    return function (options) {
        return Object.assign(options, {
            maxInlineResultsDisplayed: commonPickersConfig.DEFAULT_MAX_RESULTS,
            maxResultsDisplayedPerGroup: commonPickersConfig.DEFAULT_MAX_RESULTS_PER_GROUP,
            ajaxOptions: getAjaxOptions(options.baseAjaxOptions),
            containsStaticSuggestions: false
        });
    };
});
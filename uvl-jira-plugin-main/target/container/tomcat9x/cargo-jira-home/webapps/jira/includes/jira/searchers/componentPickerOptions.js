define('jira/searchers/element/component-picker-options', ['wrm/context-path', 'jira/util/formatter', 'jira/ajs/list/item-descriptor', 'jira/ajs/list/group-descriptor', 'jira/searchers/element/common-pickers-config'], function (contextPath, formatter, ItemDescriptor, GroupDescriptor, commonPickersConfig) {
    'use strict';

    /**
     * @param {Object} baseAjaxOptions
     * @param {boolean} baseAjaxOptions.useIdPrefixInValue Controls if to use component name as value (needed to accommodate both Create/Edit issue dialog and Basic issue search)
     * @param {number[]} [baseAjaxOptions.projectIds] Selected project IDs
     */

    var getAjaxOptions = function getAjaxOptions(baseAjaxOptions) {
        var data = {
            maxResults: commonPickersConfig.DEFAULT_MAX_RESULTS,
            startAt: commonPickersConfig.DEFAULT_START_AT
        };

        if (baseAjaxOptions.projectIds) {
            data.projectIds = baseAjaxOptions.projectIds;
        }

        return {
            url: contextPath() + '/rest/api/2/component/page',
            data: data,
            /**
             * @param {{maxResults:number, startAt:number, total:number, isLast:boolean, values:{id:string,description:string,name:string,iconUrl:string, statusCategory: object}[]}} data
             * @returns {GroupDescriptor[]}
             */
            formatResponse: function formatResponse(data) {
                var items = data.values.map(function (component) {
                    return new ItemDescriptor({
                        value: baseAjaxOptions.useIdPrefixInValue ? 'id:' + component.name : component.id,
                        label: component.name,
                        allowDuplicate: false,
                        highlighted: true
                    });
                });

                var notShownItemsNumber = data.total - items.length;
                var footerText = notShownItemsNumber > 0 ? formatter.I18n.getText("common.concepts.too.many.matches", notShownItemsNumber) : undefined;
                return [new GroupDescriptor({ items: items, footerText: footerText, fetchedThroughAjaxCall: true })];
            }
        };
    };

    return function (options) {
        return Object.assign(options, {
            maxInlineResultsDisplayed: commonPickersConfig.DEFAULT_MAX_RESULTS,
            maxResultsDisplayedPerGroup: commonPickersConfig.DEFAULT_MAX_RESULTS_PER_GROUP,
            ajaxOptions: getAjaxOptions(options.baseAjaxOptions),
            containsStaticSuggestions: true
        });
    };
});
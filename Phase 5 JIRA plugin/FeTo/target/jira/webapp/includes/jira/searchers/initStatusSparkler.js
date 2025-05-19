define('jira/searchers/element/status-lozenge-sparkler', ['jira/ajs/select/checkbox-multi-select-status-lozenge', 'jira/searchers/element/status-picker-options', 'jira/skate', 'jira/searchers/element/common-pickers-utils'], function (CheckboxMultiSelectStatusLozenge, statusPickerOptions, skate, commonPickersUtils) {
    'use strict';

    return skate('js-default-checkboxmultiselectstatuslozenge', {
        type: skate.type.CLASSNAME,
        created: function checkboxMultiSelectCreated(element) {
            var options = {
                element: element,
                content: 'mixed',
                baseAjaxOptions: {
                    projectIds: commonPickersUtils.getSelectedProjectsIds(),
                    issueTypeIds: commonPickersUtils.getSelectedIssueTypeIds()
                }
            };

            new CheckboxMultiSelectStatusLozenge(statusPickerOptions(options));
        }
    });
});

define('jira/searchers/element/status-picker-options', ['jquery', 'wrm/context-path', 'jira/util/formatter', 'jira/ajs/list/item-descriptor', 'jira/ajs/list/group-descriptor', 'jira/searchers/element/common-pickers-config'], function ($, contextPath, formatter, ItemDescriptor, GroupDescriptor, commonPickersConfig) {
    'use strict';

    var createOption = function createOption(status) {
        var optionElement = document.createElement('option');
        optionElement.classList.add('imagebacked');
        optionElement.dataset.icon = status.iconUrl;
        optionElement.dataset.simpleStatus = JSON.stringify(status);
        optionElement.textContent = status.name;

        return optionElement;
    };

    /**
     * @param {Object} baseAjaxOptions
     * @param {string[]} [baseAjaxOptions.projectIds] Selected project IDs
     * @param {string[]} [baseAjaxOptions.issueTypeIds] Selected issue type IDs
     */
    var getAjaxOptions = function getAjaxOptions(baseAjaxOptions) {
        var data = {
            maxResults: commonPickersConfig.DEFAULT_MAX_RESULTS,
            startAt: commonPickersConfig.DEFAULT_START_AT
        };

        if (baseAjaxOptions.projectIds) {
            data.projectIds = baseAjaxOptions.projectIds;
        }

        if (baseAjaxOptions.issueTypeIds) {
            data.issueTypeIds = baseAjaxOptions.issueTypeIds;
        }

        return {
            url: contextPath() + '/rest/api/2/status/page',
            data: data,
            /**
             * @param {{maxResults:number, startAt:number, total:number, isLast:boolean, values:{id:string,description:string,name:string,iconUrl:string, statusCategory: object}[]}} data
             * @returns {GroupDescriptor[]}
             */
            formatResponse: function formatResponse(data) {
                var items = data.values.map(function (status) {
                    return new ItemDescriptor({
                        value: status.id,
                        label: status.name,
                        iconUrl: status.iconUrl,
                        allowDuplicate: false,
                        highlighted: true,
                        model: $(createOption(status))
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

require(['jira/searchers/element/status-lozenge-sparkler', 'jira/searchers/element/status-picker-options']);
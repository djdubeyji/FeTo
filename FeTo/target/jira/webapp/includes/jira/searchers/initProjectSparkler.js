define('jira/searchers/element/project-sparkler', ['jira/ajs/select/checkbox-multi-select', 'jira/skate', 'jquery', 'jira/searchers/element/project-picker-options'], function (CheckboxMultiSelect, skate, $, projectPickerOptions) {
    'use strict';

    return skate('js-project-checkboxmultiselect', {
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

            new CheckboxMultiSelect(projectPickerOptions(options));
        }
    });
});

define('jira/searchers/element/project-picker-options', ['wrm/context-path', 'jira/util/formatter', 'jira/ajs/list/item-descriptor', 'jira/ajs/list/group-descriptor', 'jira/searchers/element/common-pickers-config'], function (contextPath, formatter, ItemDescriptor, GroupDescriptor, commonPickersConfig) {
    'use strict';

    var domParser = new DOMParser();
    var getAjaxOptions = function getAjaxOptions() {
        return {
            url: contextPath() + '/rest/api/latest/projects/picker',
            data: {
                maxResults: commonPickersConfig.DEFAULT_MAX_RESULTS
            },
            /**
             * @param {{header:string, total:number, projects:{html:string,id:string,key:string,name:string,avatar:string}[]}} data
             * @returns {GroupDescriptor[]}
             */
            formatResponse: function formatResponse(data) {
                var items = data.projects.map(function (project) {
                    return new ItemDescriptor({
                        value: project.id,
                        label: domParser.parseFromString(project.html, 'text/html').body.innerText || project.name,
                        icon: project.avatar,
                        html: project.html,
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

require(['jira/searchers/element/project-picker-options', 'jira/searchers/element/project-sparkler']);
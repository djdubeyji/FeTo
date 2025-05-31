define("jira/searchers/element/label-sparkler", ['jira/ajs/select/checkbox-multi-select', 'jira/ajs/list/group-descriptor', 'jira/ajs/list/item-descriptor', 'jira/skate', 'underscore', 'wrm/context-path'], function (CheckboxMultiSelect, GroupDescriptor, ItemDescriptor, skate, _, contextPath) {
    'use strict';

    return skate("js-label-checkboxmultiselect", {
        type: skate.type.CLASSNAME,
        created: function checkboxMultiSeletCreated(element) {
            var cms = new CheckboxMultiSelect({
                element: element,
                ajaxOptions: {
                    url: contextPath() + "/rest/api/1.0/labels/suggest",
                    minQueryLength: 0,
                    formatResponse: function formatResponse(response) {
                        var selectedValues = cms.model.getSelectedValues();
                        return [new GroupDescriptor({
                            items: _.map(_.sortBy(_.reject(response.suggestions, function (suggestion) {
                                return _.contains(selectedValues, suggestion.label);
                            }), "label"), function (suggestion) {
                                return new ItemDescriptor({
                                    highlighted: true,
                                    html: suggestion.html,
                                    label: suggestion.label,
                                    value: suggestion.label,
                                    title: suggestion.label
                                });
                            })
                        })];
                    }
                }
            });
        }
    });
});

require(["jira/searchers/element/label-sparkler"]);
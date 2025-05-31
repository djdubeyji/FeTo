/**
 * A pageableCollection for fetching paginated customfields
 */
define('jira/customfields/customfieldsCollection', ['jira/backbone/backbone-paginator', 'jira/moment', 'wrm/context-path', 'underscore'], function (PageableCollection, moment, contextPath, _) {
    'use strict';

    var NumberFormatter = new Intl.NumberFormat();
    return PageableCollection.extend({
        url: contextPath() + '/rest/api/2/customFields',
        state: {
            pageSize: 50
        },
        queryParams: {
            currentPage: 'startAt',
            pageSize: 'maxResults',
            search: function search() {
                return this.searchTerm;
            },
            projectIds: function projectIds() {
                return this.getFilterValues('projectIds');
            },
            types: function types() {
                return this.getFilterValues('types');
            },
            screenIds: function screenIds() {
                return this.getFilterValues('screenIds');
            },
            sortOrder: function sortOrder() {
                return this.getFilterValues('sortOrder');
            },
            sortColumn: function sortColumn() {
                return this.getFilterValues('sortColumn');
            },
            lastValueUpdate: function lastValueUpdate() {
                return this.getFilterValues('lastValueUpdate');
            }
        },
        filters: {
            projectIds: [],
            types: [],
            screenIds: [],
            sortOrder: null,
            sortColumn: null,
            lastValueUpdate: null
        },
        /**
         * Map response to state
         * @param resp - response from the server
         * @param {Number} resp.total - amount of items
         */
        parseState: function parseState(resp) {
            return {
                totalRecords: resp.total
            };
        },
        /**
         * @param response
         * @param response.values {Array} array of custom fields
         * @returns {Array|undefined} formatted custom fields
         */
        parseRecords: function parseRecords(_ref) {
            var values = _ref.values;

            if (_.isArray(values)) {
                return values.map(function (customfield) {
                    return _.extend(customfield, {
                        formattedIssuesWithValue: customfield.issuesWithValue && NumberFormatter.format(customfield.issuesWithValue),
                        formattedLastValueUpdate: customfield.lastValueUpdate && moment(customfield.lastValueUpdate).format('MMM DD, YYYY')
                    });
                });
            }

            return values;
        },
        getFilterValues: function getFilterValues(name) {
            if (Number.isInteger(this.filters[name])) {
                return this.filters[name];
            }
            return !_.isEmpty(this.filters[name]) ? this.filters[name] : undefined;
        },
        /**
         * Clear bulk selection
         */
        resetDeleteData: function resetDeleteData() {
            this.each(function (customfield) {
                customfield.set('isSelected', false);
            });
        },
        /**
         * Returns custom field models that can be deleted
         * @returns {Array}
         */
        getSelectableModels: function getSelectableModels() {
            return this.models.filter(function (model) {
                return !model.get('isLocked') && !model.get('isManaged');
            });
        }
    });
});
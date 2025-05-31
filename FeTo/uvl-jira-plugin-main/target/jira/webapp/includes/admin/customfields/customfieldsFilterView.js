/**
 * This view renders the custom field filters
 */
define('jira/customfields/customfieldsFilterView', ['atlassian/libs/underscore-1.8.3', 'jira/marionette-4.1', 'jira/analytics', 'jira/featureflags/feature-manager', 'jira/util/formatter', 'jira/customfields/customfieldsFilterDropdownView', 'jira/customfields/customfieldsSelectDropdownView', 'jira/customfields/customfieldsFilterProjectCollection', 'jira/customfields/customfieldsFilterTypesCollection', 'jira/customfields/customfieldsFilterScreensCollection', 'jira/customfields/customfieldsSelectLastValueUpdateCollection'], function (_, Marionette, analytics, FeatureManager, formatter, CustomfieldsFilterDropdownView, CustomfieldsSelectDropdownView, CustomfieldsFilterProject, CustomfieldsFilterTypes, CustomfieldsFilterScreens, CustomfieldsSelectLastValueUpdate) {
    'use strict';

    var SHOW_LAST_VALUE_UPDATE_FILTER = FeatureManager.isFeatureEnabled('jira.customfields.cleanup.identification');
    return Marionette.View.extend({
        template: JIRA.Templates.Admin.Customfields.filterContainer,
        templateContext: {
            showLastValueUpdateFilter: SHOW_LAST_VALUE_UPDATE_FILTER
        },
        ui: {
            searchInput: '#custom-fields-filter-text',
            projectsTrigger: '#projects-dropdown-trigger',
            typesTrigger: '#types-dropdown-trigger',
            screensTrigger: '#screens-dropdown-trigger',
            lastValueUpdateTrigger: '#last-value-update-dropdown-trigger',
            projectsDropdown: '#projects-filter-dropdown',
            typesDropdown: '#types-filter-dropdown',
            screensDropdown: '#screens-filter-dropdown',
            lastValueUpdateDropdown: '#last-value-update-filter-dropdown',
            container: '.customfield-filter-items'
        },
        regions: function regions() {
            var regions = {
                screens: {
                    el: '#screens-filter-dropdown',
                    replaceElement: true
                },
                types: {
                    el: '#types-filter-dropdown',
                    replaceElement: true
                },
                projects: {
                    el: '#projects-filter-dropdown',
                    replaceElement: true
                }
            };
            if (SHOW_LAST_VALUE_UPDATE_FILTER) {
                regions.lastValueUpdate = {
                    el: '#last-value-update-filter-dropdown',
                    replaceElement: true
                };
            }
            return regions;
        },
        events: {
            'input @ui.searchInput': 'performTextSearch',
            'aui-dropdown2-show @ui.projectsDropdown': function auiDropdown2ShowUiProjectsDropdown() {
                this.projectsDropdownView.reorderItems();
                this.projectsDropdownView.focusField();
            },
            'aui-dropdown2-show @ui.typesDropdown': function auiDropdown2ShowUiTypesDropdown() {
                this.typesDropdownView.reorderItems();
                this.typesDropdownView.focusField();
            },
            'aui-dropdown2-show @ui.screensDropdown': function auiDropdown2ShowUiScreensDropdown() {
                this.screensDropdownView.reorderItems();
                this.screensDropdownView.focusField();
            }
        },
        childViewEvents: {
            'filter:changed': 'onChildviewFilterChanged',
            'filter:cleared': 'onChildviewFilterCleared',
            'option:selected': 'onChildviewOptionSelected'
        },
        initialize: function initialize() {
            this.projectFilterCollection = new CustomfieldsFilterProject();
            this.typesFilterCollection = new CustomfieldsFilterTypes();
            this.screensFilterCollection = new CustomfieldsFilterScreens();
            this.lastValueUpdateCollection = new CustomfieldsSelectLastValueUpdate();

            this.projectsDropdownView = new CustomfieldsFilterDropdownView({
                collection: this.projectFilterCollection,
                id: 'projects-filter-dropdown',
                customfieldCollection: this.collection
            });
            this.typesDropdownView = new CustomfieldsFilterDropdownView({
                collection: this.typesFilterCollection,
                id: 'types-filter-dropdown',
                customfieldCollection: this.collection
            });
            this.screensDropdownView = new CustomfieldsFilterDropdownView({
                collection: this.screensFilterCollection,
                id: 'screens-filter-dropdown',
                customfieldCollection: this.collection
            });
            if (SHOW_LAST_VALUE_UPDATE_FILTER) {
                this.lastValueUpdateDropdownView = new CustomfieldsSelectDropdownView({
                    collection: this.lastValueUpdateCollection,
                    id: 'last-value-update-filter-dropdown'
                });
            }
        },
        onRender: function onRender() {
            this.unwrapTemplate();

            this.showChildView('projects', this.projectsDropdownView);
            this.showChildView('types', this.typesDropdownView);
            this.showChildView('screens', this.screensDropdownView);
            if (SHOW_LAST_VALUE_UPDATE_FILTER) {
                this.showChildView('lastValueUpdate', this.lastValueUpdateDropdownView);
            }

            this.setButtonsText(this.projectFilterCollection);
            this.setButtonsText(this.screensFilterCollection);
            this.setButtonsText(this.typesFilterCollection);
            if (SHOW_LAST_VALUE_UPDATE_FILTER) {
                this.setButtonsText(this.lastValueUpdateCollection, true);
            }
        },
        /**
         * Update button and perform search on filter change
         * @param childView
         */
        onChildviewFilterChanged: function onChildviewFilterChanged(childView) {
            var filterCollection = childView.model.collection;
            var filterId = filterCollection.id;

            var item = childView.getUI('filter');
            var filterValue = item.val();
            var checked = item.prop('checked');

            var filter = this.collection.filters[filterId];

            if (checked && !_.contains(filter, filterValue)) {
                filter.push(filterValue);
            } else if (!checked && _.contains(filter, filterValue)) {
                filter.splice(filter.indexOf(filterValue), 1);
            }
            this.sendAnalyticsFilterEvent(filterId, filter);
            this.setButtonsText(filterCollection);
            this.performSearch();
        },
        /**
         * Update button and perform search on select item change
         * @param childView
         */
        onChildviewOptionSelected: function onChildviewOptionSelected(childView) {
            var filterCollection = childView.model.collection;
            var filterId = filterCollection.id;


            this.collection.filters[filterId] = childView.model.get('value');
            this.sendAnalyticsFilterEvent(filterId, [childView.model.get('value')]);
            this.setButtonsText(childView.model.collection, true);
            this.performSearch();
        },
        onChildviewFilterCleared: function onChildviewFilterCleared(collection) {
            this.setButtonsText(collection);
            this.performSearch();
        },
        performSearch: function performSearch() {
            var _this = this;

            // show loading indicator
            this.triggerMethod('search:start');
            this.collection.getFirstPage({ reset: true }).always(function () {
                // hide loading indicator
                _this.triggerMethod('search:end');
            }).fail(function (error) {
                return _this.triggerMethod('navigate:error', error);
            });
        },
        performTextSearch: _.debounce(function () {
            var _this2 = this;

            var input = this.getUI('searchInput');
            var searchTerm = input.val();

            // Because of IE11 triggers 'input' event on focus if input field has a placeholder,
            // let it be an additional check to prevent search loop
            if (searchTerm === this.currentInputValue) {
                return;
            }
            // show loading indicator
            this.triggerMethod('search:start');
            // prevent user from input while loading
            input.blur();
            this.currentInputValue = searchTerm;
            this.collection.searchTerm = searchTerm;
            this.collection.getFirstPage({ reset: true }).always(function () {
                input.focus();
                // hide loading indicator
                _this2.triggerMethod('search:end');
            }).fail(function (error) {
                return _this2.triggerMethod('navigate:error', error);
            });
        }, 500),
        // for capability with IE11
        currentInputValue: '',
        /**
         * Send filter event to analytics, attach filter values.
         * Renaming filter name to keep consistency with pre-8.15 names
         * @param {String} filterName - filter name
         * @param {Array<String|Number>} filterValues - array of values select
         * @since 8.15
         */
        sendAnalyticsFilterEvent: function sendAnalyticsFilterEvent(filterName, filterValues) {
            var filter = filterName;

            switch (filterName) {
                case 'projectIds':
                    filter = 'projects';
                    break;
                case 'types':
                    filter = 'types';
                    break;
                case 'screenIds':
                    filter = 'screens';
                    break;
                case 'lastValueUpdate':
                    filter = 'lastvalueupdate';
                    break;
            }

            analytics.send({
                name: 'admin.customfields.filter.' + filter,
                properties: {
                    values: filterValues || []
                }
            });
        },
        /**
         * Set button (dropdown trigger) text.
         * Display filter values, optionally preceded by filter name - if forced, or if values are empty/falsy
         * @param {Backbone.Collection} filterCollection - collection containing values of the dropdowns
         * @param {Boolean} [alwaysIncludeFilterName] - should display filter name together with values
         */
        setButtonsText: function setButtonsText(filterCollection, alwaysIncludeFilterName) {
            var filterId = filterCollection.id,
                name = filterCollection.name;

            var button = this.getUI(name + 'Trigger');
            var filterValues = this.collection.filters[filterId] || [];

            if (!filterValues || Array.isArray(filterValues) && filterValues.length === 0) {
                return button.text(this._getDefaultButtonText(name));
            }

            var filterText = alwaysIncludeFilterName ? this._getFilterTitle(name) + ': ' : '';
            return button.text(filterText + this._getAppliedFilterNames(name, filterValues));
        },

        /**
         * Get filter title (i.e. "Projects")
         * @param filterName
         * @return {string}
         * @private
         */
        _getFilterTitle: function _getFilterTitle(filterName) {
            var filterTitle = void 0;
            switch (filterName) {
                case 'projects':
                    filterTitle = formatter.I18n.getText('common.words.project');
                    break;
                case 'screens':
                    filterTitle = formatter.I18n.getText('admin.common.words.screen');
                    break;
                case 'types':
                    filterTitle = formatter.I18n.getText('admin.common.words.type');
                    break;
                case 'lastValueUpdate':
                    filterTitle = formatter.I18n.getText('admin.issuefields.last.value.update');
                    break;
            }
            return filterTitle;
        },
        /**
         * Get default button text (ie. when nothing is selected)
         * @param filterName
         * @return {string}
         * @private
         */
        _getDefaultButtonText: function _getDefaultButtonText(filterName) {
            var filterTitle = this._getFilterTitle(filterName);
            return filterTitle + ': ' + formatter.I18n.getText('common.words.all');
        },
        /**
         * Get comma-separated list of filter values or a single value
         * @param filterName {String} - name of the filter (collection)
         * @param filterValue {Array|Number|null} - value of filter
         * @return {string}
         * @private
         */
        _getAppliedFilterNames: function _getAppliedFilterNames(filterName, filterValue) {
            var filterCollection = void 0;

            switch (filterName) {
                case 'projects':
                    filterCollection = this.projectFilterCollection;
                    break;
                case 'screens':
                    filterCollection = this.screensFilterCollection;
                    break;
                case 'types':
                    filterCollection = this.typesFilterCollection;
                    break;
                case 'lastValueUpdate':
                    filterCollection = this.lastValueUpdateCollection;
                    break;
            }

            if (!Array.isArray(filterValue)) {
                return filterCollection.find({ value: filterValue }).get('name');
            }

            var names = filterCollection.reduce(function (accumulator, model) {
                if (_.contains(filterValue, model.id.toString()) && model.get('name').length > 0) {
                    accumulator.push(model.get('name'));
                }
                return accumulator;
            }, []);
            return names.join(', ');
        }
    });
});
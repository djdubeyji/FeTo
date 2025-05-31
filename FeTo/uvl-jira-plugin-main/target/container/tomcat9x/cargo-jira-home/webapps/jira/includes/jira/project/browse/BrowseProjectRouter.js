define('jira/project/browse/router', ['underscore', 'jira/backbone-1.3.3', 'jira/util/navigation'], function (_, Backbone, Navigation) {
    'use strict';

    return Backbone.Router.extend({
        initialize: function initialize(options) {
            this.route(/(.*)/, 'every', this.handleRouteChange);

            this.application = options.application;

            this.listenTo(this.application.layout.paginationView, 'navigate', function (pageNumber) {
                var params = _.extend(this.application.filter.getQueryParams(false), {
                    'page': pageNumber
                });
                Navigation.navigate(params);
            });

            this.listenTo(this.application.layout.projectCollectionView, 'sorted', function (sortColumn, sortOrder) {
                var params = _.extend(this.application.filter.getQueryParams(false), {
                    'sortColumn': sortColumn,
                    'sortOrder': sortOrder
                });
                Navigation.navigate(params);
            });

            this.application.filter.on('filter', function (params) {
                Navigation.navigate(params);
            });
        },
        getParams: function getParams() {
            var categoryId = Navigation.getParam('selectedCategory') || '';
            var projectTypeId = Navigation.getParam('selectedProjectType') || '';
            return {
                categoryId: categoryId,
                projectTypeId: projectTypeId,
                page: +Navigation.getParam('page', true) || 1,
                contains: Navigation.getParam('contains', true) || '',
                sortColumn: Navigation.getParam('sortColumn') || '',
                sortOrder: Navigation.getParam('sortOrder') || '',
                category: this.application.categories.selectCategory(categoryId),
                projectType: this.application.availableProjectTypes.selectProjectType(projectTypeId)
            };
        },
        handleRouteChange: function handleRouteChange() {
            var params = this.getParams();

            if (params.contains) {
                this.application.filter.set('contains', params.contains, { silent: true });
            }
            if (params.category !== false) {
                this.application.filter.set('category', params.category.toJSON(), { silent: true });
            }
            if (params.projectType !== false) {
                this.application.filter.set('projectType', params.projectType.toJSON(), { silent: true });
            }
            if (params.sortColumn) {
                this.application.filter.set('sortColumn', params.sortColumn, { silent: true });
            }
            if (params.sortOrder) {
                this.application.filter.set('sortOrder', params.sortOrder, { silent: true });
            }

            if (params.sortOrder && params.sortColumn) {
                this.application.projects.updateSorting(params.sortColumn, params.sortOrder);
            }

            this.application.filter.filterCollection();
            if (params.page && params.page !== this.application.projects.state.currentPage) {
                this.application.projects.getPage(params.page);
            }
            this.application.layout.render();
        }
    });
});
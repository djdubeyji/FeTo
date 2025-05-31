define('jira/project/browse/projectcollectionview', ['jquery', 'jira/backbone.radio-2.0', 'jira/marionette-4.1', 'jira/util/users/logged-in-user', 'jira/util/data/meta', 'jira/project/browse/projectview', 'jira/project/project-type-keys', 'jira/project/browse/projects-empty-view', 'jira/project/browse/projects-empty-view-with-action', 'jira/project/browse/archived-projects-empty-view', 'jira/util/formatter'], function ($, BackboneRadio, Marionette, loggedInUser, meta, ProjectView, ProjectTypeKeys, EmptyView, EmptyViewWithAction, ArchivedEmptyView, formatter) {
    "use strict";

    return Marionette.CollectionView.extend({
        template: JIRA.Templates.Project.Browse.projects,
        templateContext: function templateContext() {
            return {
                // dude is an admin
                isAdmin: loggedInUser.isSysadmin() || loggedInUser.isAdmin(),
                // we are in administration, not global browse projects
                isAdminMode: meta.get('in-admin-mode')
            };
        },

        events: {
            'click th.sortable button': function clickThSortableButton(event) {
                this._sort($(event.currentTarget).data('sort-key'));
            }
        },
        childView: ProjectView,
        childViewContainer: 'tbody',
        childViewEvents: {
            'project-view.click-project-name': function projectViewClickProjectName(childView) {
                var project = childView.model;
                var position = this.collection.indexOf(project);
                this.trigger('project-view.click-project-name', project, position);
                this.analyticsChannel.trigger('browse-projects.project-view.click-project-name', project, position);
            },
            'project-view.click-lead-user': function projectViewClickLeadUser(childView) {
                var project = childView.model;
                var position = this.collection.indexOf(project);
                this.trigger('project-view.click-lead-user', project, position);
                this.analyticsChannel.trigger('browse-projects.project-view.click-lead-user', project, position);
            },
            'project-view.click-category': function projectViewClickCategory(childView) {
                var project = childView.model;
                var position = this.collection.indexOf(project);
                this.triggerMethod('project-view.click-category', project, position);
                this.analyticsChannel.trigger('browse-projects.project-view.click-category', project, position);
            },
            'project-view.click-url': function projectViewClickUrl(childView) {
                var project = childView.model;
                var position = this.collection.indexOf(project);
                this.trigger('project-view.click-url', project, position);
                this.analyticsChannel.trigger('browse-projects.project-view.click-url', project, position);
            }
        },
        emptyViewOptions: function emptyViewOptions() {
            return {
                filters: this.model,
                hasArchivedProjects: this.hasArchivedProjects()
            };
        },
        emptyView: function emptyView() {
            if (!this.hasArchivedProjects() && this.model.get('category').id === 'archived') {
                return ArchivedEmptyView;
            }
            if (this.shouldUseCallToActionTemplate()) {
                return EmptyViewWithAction;
            } else {
                return EmptyView;
            }
        },
        initialize: function initialize() {
            this.analyticsChannel = BackboneRadio.channel('browse-projects-analytics');
        },

        onRender: function onRender(event) {
            this.unwrapTemplate();
            if (event.$el) {
                this._recoverFocusOnRender(event.$el);
            }
        },
        _getTranslationColumn: function _getTranslationColumn(column) {
            switch (column) {
                case 'name':
                    return formatter.I18n.getText('common.concepts.project');
                case 'key':
                    return formatter.I18n.getText('common.concepts.key');
                case 'projectTypeName':
                    return formatter.I18n.getText('browseprojects.project.type');
                case 'lead':
                    return formatter.I18n.getText('browseprojects.project.lead');
                case 'projectCategoryId':
                    return formatter.I18n.getText('browseprojects.project.category');
                case 'archivedTimestamp':
                    return formatter.I18n.getText('browseprojects.archived.date');
                case 'archivedBy':
                    return formatter.I18n.getText('browseprojects.archived.by');
                case 'lastUpdatedTimestamp':
                    return formatter.I18n.getText('browseprojects.updated.date');
                case 'issueCount':
                    return formatter.I18n.getText('browseprojects.issue.count');
                default:
                    return false;
            }
        },
        _createAssistiveRegion: function _createAssistiveRegion(ariaLiveText) {
            return JIRA.Templates.Project.Browse.assistiveRegion({ ariaLiveText: ariaLiveText });
        },
        _getAssistiveRegionText: function _getAssistiveRegionText() {
            return document.querySelector('#assistive-text');
        },
        _removeAssistiveRegionText: function _removeAssistiveRegionText() {
            var assistiveRegionText = document.querySelectorAll('#assistive-text');
            if (assistiveRegionText) {
                assistiveRegionText.forEach(function (elem) {
                    elem.remove();
                });
            }
        },
        _updateAssistiveRegion: function _updateAssistiveRegion(sortColumn, sortOrder) {
            // let's remove old text if presented
            this._removeAssistiveRegionText();

            var assistiveRegion = document.getElementById("assistive-projects");
            if (!assistiveRegion) {
                return;
            }
            var translatedColumn = this._getTranslationColumn(sortColumn);
            if (!translatedColumn) {
                return;
            }
            assistiveRegion.insertAdjacentHTML('beforeend', this._createAssistiveRegion(formatter.I18n.getText('common.concepts.sort.region', translatedColumn, sortOrder)));

            var assistiveRegionText = this._getAssistiveRegionText();
            if (assistiveRegionText) {
                setTimeout(function () {
                    assistiveRegionText.remove();
                }, 1000);
            }
        },
        _recoverFocusOnRender: function _recoverFocusOnRender(el) {
            var activeEl = $(el).find('th.sortable.active button');
            if (activeEl) {
                activeEl.focus();
            }
        },
        _sort: function _sort(sortColumn) {
            if (this.model.get('sortOrder') === 'ascending' && this.model.get('sortColumn') === sortColumn) {
                this.model.set('sortOrder', 'descending');
            } else {
                this.model.set('sortOrder', 'ascending');
                this.model.set('sortColumn', sortColumn);
            }
            this.collection.updateSorting(sortColumn, this.model.get('sortOrder'));
            this.trigger('sorted', sortColumn, this.model.get('sortOrder'));
            this._updateAssistiveRegion(sortColumn, this.model.get('sortOrder'));
            this.render();
        },
        hasArchivedProjects: function hasArchivedProjects() {
            return !!this.model.filterByCategory("archived", this.collection.originalCollection).length;
        },
        shouldUseCallToActionTemplate: function shouldUseCallToActionTemplate() {
            var validProjectTypes = [ProjectTypeKeys.SOFTWARE, ProjectTypeKeys.SERVICE_DESK, ProjectTypeKeys.BUSINESS];
            return this.model.get("projectType") && this.model.get("category").id === "all" && this.model.get("contains") === "" && validProjectTypes.indexOf(this.model.get("projectType").key) !== -1;
        }
    });
});
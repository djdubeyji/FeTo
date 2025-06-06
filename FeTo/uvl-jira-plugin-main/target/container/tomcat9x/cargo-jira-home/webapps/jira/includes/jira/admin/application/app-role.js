define("jira/admin/application/grouppicker", ['jira/util/formatter', "jquery", "underscore", "marionette", "jira/ajs/select/single-select", "jira/ajs/list/group-descriptor", "jira/ajs/list/item-descriptor", "wrm/context-path"], function (formatter, $, _, Marionette, SingleSelect, GroupDescriptor, ItemDescriptor, wrmContextPath) {
    "use strict";

    var templates = JIRA.Templates.Admin.ApplicationAccess;
    var contextPath = wrmContextPath();

    /**
     * A `Marionette.ItemView` for a group selector.
     *
     * Its a `SingleSelect` that makes calls to the group picker resource to find the groups.
     *
     * @extends Marionette.ItemView
     */
    return Marionette.ItemView.extend({
        initialize: function initialize() {
            this._exclude = [];
        },
        onShow: function onShow() {
            this.select = new SingleSelect({
                element: this.ui.groups,
                itemAttrDisplayed: "label",
                showDropdownButton: true,
                ajaxOptions: {
                    data: function data(query) {
                        return {
                            query: query
                        };
                    },
                    url: contextPath + "/rest/api/2/groups/picker",
                    query: true, // keep going back to the server for each keystroke
                    formatResponse: this._format.bind(this)
                }
            });
            this.select.showErrorMessage = $.noop;
        },
        tagName: "div",
        template: templates.groupSingleSelect,
        ui: {
            groups: ".ss-group-picker"
        },
        events: {
            "selected .ss-group-picker": "_changed"
        },
        _changed: function _changed() {
            this.options.bus.trigger("selectGroup", this.ui.groups.val()[0]);
            this.select.clear();
        },
        excludeGroups: function excludeGroups() {
            this._exclude = _.union(this._exclude, _.toArray(arguments));
        },
        includeGroups: function includeGroups() {
            this._exclude = _.difference(this._exclude, _.toArray(arguments));
        },
        _format: function _format(data) {
            var descriptorArgs = { weight: 0 };
            var exclude = this._exclude;
            var total = data.total;

            var items = [];
            _.each(data.groups, function (group) {
                if (_.contains(exclude, group.name)) {
                    total = total - 1;
                } else {
                    items.push(new ItemDescriptor({
                        value: group.name, // value of item added to select
                        label: group.name, // title of lozenge
                        html: group.html,
                        highlighted: true
                    }));
                }
            });

            if (items.length < total) {
                descriptorArgs.label = formatter.I18n.getText("application.access.configuration.groups.partial", items.length, total);
            }

            var groupDescriptor = new GroupDescriptor(descriptorArgs);
            _.each(items, function (item) {
                groupDescriptor.addItem(item);
            });

            return [groupDescriptor];
        },
        serializeData: function serializeData() {
            return {
                id: _.uniqueId()
            };
        },
        showLoading: function showLoading() {
            var instance = this;
            if (this.select && !this._loading) {
                this._loading = $(templates.loading());
                this._timeout = window.setTimeout(function () {
                    instance.ui.groups.before(instance._loading);
                }, 100);
            }
            return this;
        },
        hideLoading: function hideLoading() {
            if (this._loading) {
                window.clearTimeout(this._timeout);
                this._timeout = null;
                this._loading.remove();
                delete this._loading;
            }
            return this;
        }
    });
});

define("jira/admin/application/approleeditor", ["jquery", "underscore", "jira/backbone-1.3.3", "marionette", "jira/skate", "jira/admin/application/grouppicker", "wrm/data", "aui/inline-dialog2", "jira/admin/application/application-role-labels"], function ($, _, Backbone, Marionette, skate, GroupPicker, wrmData) {
    "use strict";

    var templates = JIRA.Templates.Admin.ApplicationAccess;
    var upgradeJIRAUrl = wrmData.claim("com.atlassian.jira.web.action.admin.application-access:upgrade-jira-url");
    var reduceUserCountUrl = wrmData.claim("com.atlassian.jira.web.action.admin.application-access:reduce-user-count-url");
    var managingGroupsUrl = wrmData.claim("com.atlassian.jira.web.action.admin.application-access:managing-groups-url");

    var Bus = function Bus() {
        return _.extend(this, Backbone.Events);
    };

    /**
     * Represents a group in a ApplicationRole.
     */
    var ApplicationRoleGroupModel = Backbone.Model.extend({
        defaults: {
            name: null,
            isDefault: false,
            canRemove: true,
            canToggle: true
        },
        idAttribute: "name",
        disable: function disable() {
            this.set({
                canRemove: false,
                canToggle: false
            });
        },
        enable: function enable() {
            this.set({
                canToggle: true,
                canRemove: true
            });
        }
    });

    /**
     * Represents the set of groups in a ApplicationRole.
     */
    var ApplicationRoleGroupCollection = Backbone.Collection.extend({
        model: ApplicationRoleGroupModel
    });

    /**
     * Represents a ApplicationRole.
     */
    var ApplicationRoleModel = Backbone.Model.extend({
        defaults: {
            name: null,
            groups: null
        }
    });

    /**
     * View to render when no groups exist for a ApplicationRole.
     */
    var ApplicationRoleEditorEmptyRowView = Marionette.ItemView.extend({
        template: templates.roleEditorTableEmpty,
        tagName: "tr"
    });

    /**
     * A controller that deals with showing warning dialogs.
     */
    var WarningDialogController = Marionette.Controller.extend({
        initialize: function initialize(options) {
            this.bus = options.bus;
            this.model = options.model;
            this.listenTo(this.bus, "showDefaultGroupWarning", this._showDefaultGroupWarning);
            this.listenTo(this.bus, "showAddGroupWarning", this._showAddGroupWarning);
        },
        _getApplicationRoleId: function _getApplicationRoleId() {
            return this.model.collection.applicationRoleModel.get("key") + "-" + this.model.cid;
        },
        getDefaultGroupWarningId: function getDefaultGroupWarningId() {
            return "group-reuse-" + this._getApplicationRoleId() + "-default-warning";
        },
        getAddGroupWarningId: function getAddGroupWarningId() {
            return "group-reuse-" + this._getApplicationRoleId() + "-add-warning";
        },
        _showAddGroupWarning: function _showAddGroupWarning(groupName) {
            if (this.model.get("name") === groupName) {
                this._showWarningDialog(this.getAddGroupWarningId());
            }
        },
        _showDefaultGroupWarning: function _showDefaultGroupWarning(groupName) {
            if (this.model.get("name") === groupName) {
                this._showWarningDialog(this.getDefaultGroupWarningId());
            }
        },
        _showWarningDialog: function _showWarningDialog(warningDialogId) {
            var warningDialog = $("#" + warningDialogId);
            var warningDialogEl = warningDialog[0];
            // We need to force skate to initialize the component, as skate lazy loads components
            skate.init(warningDialogEl);

            warningDialog.one("aui-layer-hide", function (e) {
                e.preventDefault();
                warningDialog.remove();
            });

            // TODO: Once AUI-4155 fix is deployed, check if we can remove this setTimeout
            setTimeout(function () {
                warningDialogEl.open = true;
            }, 0);
        }
    });

    /**
     * View to render for each group in a ApplicationRole.
     */
    var ApplicationRoleEditorRowView = Marionette.ItemView.extend({
        template: templates.roleEditorRow,
        tagName: "tr",
        events: {
            "click .application-role-remove": "_remove",
            "change .application-role-default-input": "_toggleDefault"
        },
        modelEvents: {
            "change:isDefault change:canToggle change:canRemove change:userCount": "render"
        },
        initialize: function initialize(options) {
            this.bus = options.bus;
            this.warningController = new WarningDialogController({ bus: this.bus, model: this.model });
        },
        onClose: function onClose() {
            this.warningController.stopListening();
        },
        _remove: function _remove(e) {
            e.preventDefault();
            this.bus.trigger("removeGroup", this.model.id);
        },
        _toggleDefault: function _toggleDefault(e) {
            var dialog = document.getElementById(this.warningController.getDefaultGroupWarningId());
            if (dialog) {
                dialog.open = false;
            }

            e.preventDefault();
            this.bus.trigger("toggleDefault", this.model.id);
        },
        _getAppsContainingGroup: function _getAppsContainingGroup(appRoles, groupName) {
            return _.pairs(appRoles).filter(function (e) {
                return _.contains(e[1], groupName);
            }).map(function (e) {
                return e[0];
            });
        },
        serializeData: function serializeGroupData() {
            var applicationRoleModel = this.model.collection.applicationRoleModel;
            var reusedGroups = applicationRoleModel.get("defaultGroupsExistingInAnyOtherRoles");
            var appsAndDefaultRoles = applicationRoleModel.get("appsAndDefaultRoles");
            var groupName = this.model.get("name");
            var appsReusingThisGroup = this._getAppsContainingGroup(reusedGroups, groupName);
            var appsWhereGroupIsDefault = this._getAppsContainingGroup(appsAndDefaultRoles, groupName);

            return _.extend(this.model.toJSON(), {
                appsReusingGroup: appsReusingThisGroup,
                appsWhereGroupIsDefault: appsWhereGroupIsDefault,
                roleKey: this.model.collection.applicationRoleModel.get("key"),
                roleName: this.model.collection.applicationRoleModel.get("name"),
                defaultGroupWarningId: this.warningController.getDefaultGroupWarningId(),
                addGroupWarningId: this.warningController.getAddGroupWarningId(),
                managingGroupsUrl: managingGroupsUrl
            });
        }
    });

    /**
     * The view of the groups in a ApplicationRole.
     */
    var ApplicationRoleEditorTableView = Marionette.CompositeView.extend({
        template: templates.roleEditorTable,
        itemView: ApplicationRoleEditorRowView,
        itemViewContainer: "tbody",
        emptyView: ApplicationRoleEditorEmptyRowView,
        modelEvents: {
            "change:userCount change:numberOfSeats change:remainingSeats change:hasUnlimitedSeats change:defaultGroupsExistingInAnyOtherRoles change:selectedByDefault": "render"
        },
        collectionEvents: {
            "change:isDefault": "render"
        },
        initialize: function initialize(options) {
            this.bus = options.bus;
            this.itemViewOptions = { bus: this.bus };
        },
        _getDialogId: function _getDialogId() {
            return 'user-count-details-' + this.model.get("key");
        },
        serializeData: function serializeData() {
            var hasDefaultGroup = this.collection.some(function (group) {
                return group.get("isDefault");
            });

            return _.extend({
                hasDefaultGroup: hasDefaultGroup,
                upgradeJIRAUrl: upgradeJIRAUrl,
                reduceUserCountUrl: reduceUserCountUrl,
                dialogId: this._getDialogId()
            }, this.model.toJSON());
        }
    });

    /**
     * The view of an editor for a ApplicationRole. It is the composition of a `ApplicationRoleEditorTableView` and a group
     * selector.
     */
    var ApplicationRoleEditorView = Marionette.Layout.extend({
        template: templates.roleEditor,
        regions: {
            table: ".application-role-editor-container",
            groupSelector: ".application-role-selector-container"
        },
        events: {
            "submit .application-role-editor-form": "_submit"
        },
        onShow: function onShow() {
            this.table.show(new ApplicationRoleEditorTableView(_.pick(this.options, "model", "collection", "bus")));

            var groupPicker = this.groupPicker = new GroupPicker(_.pick(this.options, "bus"));
            groupPicker.excludeGroups.apply(groupPicker, this.options.collection.pluck("name"));
            this.groupSelector.show(groupPicker);

            this.listenTo(this.options.bus, "removeGroup", function (groupName) {
                groupPicker.includeGroups(groupName);
            });

            this.listenTo(this.options.bus, "selectGroup", function (groupName) {
                groupPicker.excludeGroups(groupName);
                this.options.bus.trigger("addGroup", groupName);
            });
        },
        _submit: function _submit(e) {
            e.preventDefault();
        },
        showLoading: function showLoading() {
            this.groupPicker && this.groupPicker.showLoading();
            return this;
        },
        hideLoading: function hideLoading() {
            this.groupPicker && this.groupPicker.hideLoading();
            return this;
        }
    });

    /**
     * An object that can be used to render and edit a single ApplicationRole.
     *
     * @param {function} options.setRole Called by the editor to save the current state of the role. It must be of the
     *  form `function(groups: Array, defaultGroups: Array)`.
     * @param {Object} options.role The current state of the role. For example,
     *  `{name: "name", groups: ["a"], defaultGroups: ["a"]}`.
     */
    var ApplicationRoleEditor = function ApplicationRoleEditor(options) {
        this._put = options.setRole || $.noop;
        this.IO = options.IO;
        var roleModel = this._toModel(options.data || {});
        this._groups = roleModel.get("groups");
        this._active = 0;
        this.bus = options.bus || new Bus();

        this.view = new ApplicationRoleEditorView({
            model: roleModel,
            collection: this._groups,
            bus: this.bus
        });

        this.listenTo(this.bus, "removeGroup", this._removeGroup);
        this.listenTo(this.bus, "toggleDefault", this._toggleDefault);
        this.listenTo(this.bus, "addGroup", this._addGroup);

        _.each(this._getGroupNames(), this._loadUserCountForGroup, this);
    };

    _.extend(ApplicationRoleEditor.prototype, Backbone.Events, {
        _toggleDefault: function _toggleDefault(defaultKey) {
            var groupNames = this._getGroupNames();
            var defaultGroupNames = this._getDefaultGroupNames();
            var group = this._groups.get(defaultKey);
            if (group) {
                var wasDefault = group.get("isDefault");
                if (wasDefault) {
                    defaultGroupNames = _.without(defaultGroupNames, defaultKey);
                    if (defaultGroupNames.length === 1) {
                        //We only have one default which means we need to make sure it cannot be removed or edited.
                        this._groups.get(defaultGroupNames[0]).disable();
                    }
                } else {
                    defaultGroupNames.push(defaultKey);
                    if (defaultGroupNames.length > 1) {
                        //We now have more than one default. This means that other defaults can be removed and edited.
                        _.each(defaultGroupNames, function (groupName) {
                            this._groups.get(groupName).enable();
                        }, this);
                    } else {
                        //This is now the only default. Make sure that it cannot be edited or removed.
                        group.disable();
                    }
                }

                group.set("isDefault", !wasDefault);

                this._setRole(groupNames, defaultGroupNames).done(function () {
                    if (!wasDefault && this._canShowDefaultGroupWarning(defaultKey)) {
                        this.bus.trigger("showDefaultGroupWarning", defaultKey);
                    }
                }.bind(this));
            }
        },
        _canShowDefaultGroupWarning: function _canShowDefaultGroupWarning(groupName) {
            var defaultGroupsInOtherRoles = this._groups.applicationRoleModel.get("defaultGroupsExistingInAnyOtherRoles");
            return _.contains(_.flatten(_.values(defaultGroupsInOtherRoles)), groupName);
        },
        _removeGroup: function _removeGroup(groupName) {
            var existingGroup = this._groups.get(groupName);
            var groupNames = this._getGroupNames();
            var defaultGroupNames = this._getDefaultGroupNames();

            if (existingGroup && existingGroup.get("canRemove")) {
                var remainingGroups = _.without(groupNames, groupName);
                var remainingDefaultGroups = _.without(defaultGroupNames, groupName);
                this._groups.remove(existingGroup);

                if (remainingDefaultGroups.length === 1) {
                    //If only one default is left; disable all interaction (i.e. no remove, no toggle default).
                    this._groups.get(remainingDefaultGroups[0]).disable();
                } else if (remainingGroups.length === 1) {
                    //If its the last group then we need to make sure it can't be removed. The group can only be
                    //non-default and removable at this point. As it is the last group it cannot be removed but it
                    //can be made default.
                    this._groups.get(remainingGroups[0]).set("canRemove", false);
                }

                this._setRole(remainingGroups, remainingDefaultGroups);
            }
        },
        _addGroup: function _addGroup(groupName) {
            var existingGroup = this._groups.get(groupName);
            if (!existingGroup) {
                var groupNames = this._getGroupNames();
                groupNames.push(groupName);

                //We need to check if a non-default && non-removable group can be made removable. The only time
                //such a group exists is when it is the only group. In all other cases we want to leave the state
                //of current group(s) alone.
                if (this._groups.size() === 1) {
                    var onlyGroup = this._groups.at(0);
                    if (!onlyGroup.get("canRemove") && !onlyGroup.get("isDefault")) {
                        onlyGroup.set("canRemove", true);
                    }
                }

                this._groups.add({
                    name: groupName,
                    isDefault: false,
                    //The group can only be removed if there are more than group currently.
                    canRemove: groupNames.length > 1,
                    canToggle: true });

                this._loadUserCountForGroup(groupName);

                this._setRole(groupNames, this._getDefaultGroupNames()).done(function () {
                    if (this._getApplicationsWhereTheRoleIsDefault(groupName, this._groups.applicationRoleModel.get("appsAndDefaultRoles")).length > 0) {
                        this.bus.trigger("showAddGroupWarning", groupName);
                    }
                }.bind(this));
            }
        },
        /** Load the user count for a group, and update the model */
        _loadUserCountForGroup: function _loadUserCountForGroup(groupName) {
            this.IO.getGroupDetails(groupName).then(function (groupResponse) {
                var group = this._groups.get(groupResponse.name);
                if (group) {
                    group.set("userCount", groupResponse.users.size);
                }
            }.bind(this));
        },
        _getApplicationsWhereTheRoleIsDefault: function _getApplicationsWhereTheRoleIsDefault(groupName, roles) {
            return _.pairs(roles).filter(function (e) {
                return _.contains(e[1], groupName);
            }).map(function (e) {
                return e[0];
            });
        },
        _setRole: function _setRole(groupNames, defaultGroupNames) {
            if (this._active === 0) {
                this.view.showLoading();
            }

            this._active++;
            return this._put(groupNames || [], defaultGroupNames || []).always(function (roleModelUpdateResult) {
                this._active = Math.max(0, this._active - 1);
                if (this._active === 0) {
                    this.view.hideLoading();
                }

                if (roleModelUpdateResult) {
                    this.view.model.set({
                        remainingSeats: roleModelUpdateResult.remainingSeats,
                        numberOfSeats: roleModelUpdateResult.numberOfSeats,
                        userCount: roleModelUpdateResult.userCount,
                        hasUnlimitedSeats: roleModelUpdateResult.hasUnlimitedSeats
                    });
                }
            }.bind(this));
        },
        _getDefaultGroupNames: function _getDefaultGroupNames() {
            return _.map(this._groups.where({ isDefault: true }), function (item) {
                return item.get("name");
            });
        },
        _getGroupNames: function _getGroupNames() {
            return this._groups.pluck("name");
        },
        /**
         * Converts the raw role data into a `ApplicationRoleModel`.
         *
         * @param {Object} data the raw data. For example, {name: "name", groups: ["a"], defaultGroups: ["a"]}.
         * @returns {ApplicationRoleModel}
         */
        _toModel: function _toModel(data) {
            var collection = new ApplicationRoleGroupCollection();
            var groups = data.groups || [];

            var defaultGroups = _.intersection(groups, data.defaultGroups || []);

            collection.add(_.map(groups, function (groupName) {
                var isDefault = _.contains(defaultGroups, groupName);
                return new ApplicationRoleGroupModel({
                    isDefault: isDefault,
                    name: groupName,
                    /*
                     * A group can be:
                     *   1. Always made default not matter what.
                     *   2. Always made non-default provided there is at least one other default.
                     */
                    canToggle: !isDefault || defaultGroups.length > 1,
                    /**
                     * A group can always be removed provided:
                     *   1. There is more than one group; and
                     *   2. Its not a default or its not the last default.
                     */
                    canRemove: groups.length > 1 && (!isDefault || defaultGroups.length > 1)
                });
            }));

            var applicationRoleModel = new ApplicationRoleModel({
                key: data.key,
                name: data.name || "",
                groups: collection,
                defined: data.defined,
                selectedByDefault: data.selectedByDefault,
                userCount: data.userCount,
                userCountDescription: data.userCountDescription,
                remainingSeats: data.remainingSeats,
                numberOfSeats: data.numberOfSeats,
                hasUnlimitedSeats: data.hasUnlimitedSeats,
                defaultGroupsExistingInAnyOtherRoles: data.defaultGroupsExistingInAnyOtherRoles || {},
                appsAndDefaultRoles: data.appsAndDefaultRoles || {}
            });

            collection.applicationRoleModel = applicationRoleModel;

            return applicationRoleModel;
        }
    });

    return ApplicationRoleEditor;
});

define("jira/admin/application/approleseditor", ['jira/util/formatter', 'jira/util/logger', "jira/jquery/deferred", "jquery", "underscore", "jira/backbone-1.3.3", "marionette", "jira/ajs/ajax/smart-ajax/web-sudo", "jira/dialog/error-dialog", "jira/admin/application/approleeditor", "jira/admin/application/defaults", 'wrm/context-path'], function (formatter, logger, deferred, $, _, Backbone, Marionette, WebSudo, ErrorDialog, RoleEditor, ApplicationDefaults, wrmContextPath) {
    "use strict";

    var templates = JIRA.Templates.Admin.ApplicationAccess;
    var contextPath = wrmContextPath();

    /**
     * Generic error handler.
     */
    var errorHandler = function errorHandler(xhr, reason) {
        //Aborts are fine, lets not report them.
        if (reason !== "abort") {
            //We just display a reload error on bad request. This means that the groups are out of sync
            //with what is currently available on the server. A reload of the page will fix this. We don't use
            //the error message from the REST request because it may not relate the the action that user is performing
            //(e.g. it may report that group1 is invalid even though the user is adding group3).
            if (!xhr || xhr.status === 400) {
                new ErrorDialog({
                    message: formatter.I18n.getText("application.access.configuration.out.of.date"),
                    mode: "warning"
                }).show();
            } else {
                ErrorDialog.openErrorDialogForXHR(xhr);
            }
        }
    };

    /**
     * Compares the passed two strings in a case-insensitive manner.
     *
     * @param {String} a left-hand side of the comparison.
     * @param {String} b right-hand side of the comparison.
     * @returns {number} Returns < 0 when a < b, > 0 when a > b or 0 when a == b.
     */
    var localeCompare = function localeCompare(a, b) {
        a = a || "";
        b = b || "";
        return a.localeCompare(b);
    };

    var RolesIO = function RolesIO(options) {
        this._queued = [];
        this._requests = {};
        this._defaultFail = options.defaultFail || null;
        this._current = null;
        this._aborted = false;
        this._websudo = false;
    };

    /**
     * An abstraction for all the IO needed to the server.
     */
    _.extend(RolesIO.prototype, {
        busy: function busy() {
            return this._current != null || this._queued.length > 0;
        },

        sudoVisible: function sudoVisible() {
            return this._websudo;
        },

        /**
         * Return all the roles on the server.
         *
         * @returns {jQuery.Deferred}
         */
        getRoles: function getRoles() {
            var instance = this;
            return this._wrap(this._ajax({
                url: this._makeAllUrl(),
                dataType: "json"
            }).then(function (data, statusText, xhr) {
                _.each(data, function (item) {
                    instance._sortGroups(item);
                });

                return {
                    applicationRoles: data,
                    versionHash: xhr.getResponseHeader("ETag")
                };
            }));
        },

        /**
         * Get group details
         * @param groupName the group name
         * @returns {jquery.Deferred}
         */
        getGroupDetails: function getGroupDetails(groupName) {
            return this._wrap(this._ajax({
                url: this._makeGroupUrl(groupName),
                dataType: "json"
            }));
        },

        /**
         * Update the passed role on the server.
         *
         * @param roleKey the id of the role to update.
         * @param groups the groups to store for the role.
         * @param defaultGroups the default groups for the role.
         * @param selectedByDefault a default role on user creation.
         * @param versionHash version of data received from server in last update.
         *
         * @returns {jQuery.Deferred}
         */
        putRole: function putRole(roleKey, groups, defaultGroups, selectedByDefault, versionHash) {
            var data = {
                groups: _.toArray(groups),
                defaultGroups: _.toArray(defaultGroups),
                selectedByDefault: selectedByDefault
            };

            return this._wrap(this._ajaxForPut(roleKey, {
                url: this._makeRoleUrl(roleKey),
                dataType: "json",
                type: "PUT",
                contentType: "application/json",
                headers: { "If-Match": versionHash },
                data: JSON.stringify(data)
            })).then(this._sortGroups);
        },

        putRoles: function putRoles(collection) {
            var instance = this;

            return this._wrap(this._ajaxForPut("all", {
                url: this._makeAllUrl(),
                dataType: "json",
                type: "PUT",
                contentType: "application/json",
                headers: { "If-Match": collection.versionHash },
                data: JSON.stringify(collection)
            })).then(function (data, statusText, xhr) {
                _.each(data, function (item) {
                    instance._sortGroups(item);
                });

                return {
                    applicationRoles: data,
                    versionHash: xhr.getResponseHeader("ETag")
                };
            });
        },
        _sortGroups: function _sortGroups(data) {
            if (data && data.groups) {
                data.groups.sort(localeCompare);
            }
            return data;
        },

        _makeGroupUrl: function _makeGroupUrl(groupName) {
            return contextPath + "/rest/api/2/group?groupname=" + encodeURIComponent(groupName);
        },
        /**
         * Create a URL for the passed ROLE.
         *
         * @returns {string} the URL for the passed ROLE.
         * @private
         */
        _makeRoleUrl: function _makeRoleUrl(roleKey) {
            return contextPath + "/rest/api/2/applicationrole/" + roleKey;
        },
        /**
         * Create a URL to GET all roles.
         *
         * @returns {string} the URL for all roles.
         * @private
         */
        _makeAllUrl: function _makeAllUrl() {
            return contextPath + "/rest/api/2/applicationrole";
        },

        abort: function abort() {
            this._current && this._current.result.reject(null, "abort");
            _.each(this._requests, function (item) {
                item.result.reject(null, "abort");
            });
            this._current = null;
            this._queued = [];
            this._requests = {};
            this._aborted = true;
        },
        _activate: function _activate(request) {
            this._current = request;
            var that = this;
            var ajax = this._ajax(request.options, {
                beforeShow: function beforeShow() {
                    that._websudo = true;
                }
            });

            ajax.fail(function () {
                //Reject current request.
                request.result.rejectWith.call(request.result, this, _.toArray(arguments));

                //Abort all others.
                that._current = null;
                that.abort();
            });

            ajax.done(function () {
                request.result.resolveWith.call(request.result, this, _.toArray(arguments));
                that._dequeue();
            });

            ajax.always(function () {
                that._websudo = false;
            });
        },
        _dequeue: function _dequeue() {
            this._current = null;

            var next = this._queued.shift();
            if (next) {
                var request = this._requests[next];
                delete this._requests[next];
                this._activate(request);
            } else {
                logger.trace("role.put.finished");
            }
        },
        _ajaxForPut: function _ajaxForPut(roleKey, options) {
            if (this._aborted) {
                return deferred().reject(null, "abort");
            }

            var newRequest = {
                roleKey: roleKey,
                result: deferred(),
                options: options
            };
            if (this._current == null) {
                this._activate(newRequest);
            } else {
                var oldRequest = this._requests[roleKey];
                if (oldRequest) {
                    oldRequest.result.reject(null, "abort");
                } else {
                    this._queued.push(roleKey);
                }
                this._requests[roleKey] = newRequest;
            }
            return newRequest.result.promise();
        },
        _ajax: function _ajax(options, dialog) {
            return WebSudo.makeWebSudoRequest(options, dialog || {});
        },
        _wrap: function _wrap(def) {
            if (def && this._defaultFail) {
                def.fail(this._defaultFail);
            }
            return def;
        }
    });

    var ApplicationRoleModel = Backbone.Model.extend({
        defaults: {
            name: null,
            groups: null,
            defaultGroups: null,
            selectedByDefault: false
        },
        idAttribute: "key",

        update: function update(data) {
            data = _.extend(this.toJSON(), data);
            return this.collection.IO.putRole(data.key, data.groups, data.defaultGroups, data.selectedByDefault, this.collection.versionHash).done(function (result) {
                _.pairs(result).forEach(function (pair) {
                    this.set.apply(this, pair);
                }, this);
            }.bind(this));
        },
        defaultGroupsExistingInAnyOtherRoles: function defaultGroupsExistingInAnyOtherRoles() {
            var that = this;
            var otherApplications = this.collection.models.filter(function (model) {
                return model !== that;
            });
            var groupsByApplication = _.object(otherApplications.map(function (e) {
                return e.get("name");
            }), otherApplications.map(function (e) {
                return _.intersection(that.get("defaultGroups"), e.get("groups"));
            }));
            return _.object(_.pairs(groupsByApplication).filter(function (value) {
                return !_.isEmpty(value[1]);
            }));
        },
        /**
         * @returns {Object} mapping applications to array of default groups, for example
         *   `Object { "JIRA Software" : { "jira-administrators", "jira-users" } }`
         */
        appsAndDefaultRoles: function appsAndDefaultRoles() {
            var that = this;
            var otherApplications = this.collection.models.filter(function (model) {
                return model !== that;
            });
            var groupsByApplication = _.object(otherApplications.map(function (e) {
                return e.get("name");
            }), otherApplications.map(function (e) {
                return e.get("defaultGroups");
            }));
            return groupsByApplication;
        }
    });

    var ApplicationRoleCollection = Backbone.Collection.extend({
        model: ApplicationRoleModel,
        versionHash: null,

        initialize: function initialize(models, options) {
            this.IO = options.IO;
            this._fetched = deferred();

            this.IO.getRoles().done(function (data) {
                this.versionHash = data.versionHash;
                this.reset(data.applicationRoles);
            }.bind(this)).fail(function () {
                this._fetched.reject();
            }.bind(this));

            this.once("reset", function () {
                this._fetched.resolve();
            });
        },
        parse: function parse(response) {
            return response.applicationRoles;
        },
        whenFetched: function whenFetched() {
            return this._fetched.promise();
        },

        reload: function reload() {
            return this.IO.getRoles().done(function (data) {
                this.set(data.applicationRoles);
                this.versionHash = data.versionHash;
            }.bind(this));
        },

        updateDefaults: function updateDefaults() {
            return this.IO.putRoles(this).done(function (data) {
                this.versionHash = data.versionHash;
            }.bind(this));
        }
    });

    /**
     * View to render when there are no ApplicationRoles.
     */
    var ApplicationRolesEditorEmptyView = Marionette.ItemView.extend({
        tagName: "div",
        template: templates.noRoles
    });

    /**
     * View to render to view and edit all ApplicationRoles.
     */
    var ApplicationRolesEditorView = Marionette.CollectionView.extend({
        itemView: RoleEditor,
        tagName: "div",
        emptyView: ApplicationRolesEditorEmptyView,
        initialize: function initialize() {
            this.updateEditors = this.options.updateEditors || $.noop;
        },
        collectionEvents: {
            "change": "updateEditors"
        },
        buildItemView: function buildItemView(model, ItemView) {
            if (ItemView === this.itemView) {
                return this.options.buildRoleEditor(model);
            } else {
                //It's the empty view. Just do the default.
                return Marionette.CollectionView.prototype.buildItemView.apply(this, arguments);
            }
        }
    });

    /**
     * View to render while waiting for REST response from server.
     */
    var ApplicationRoleEditorLoadingView = Marionette.ItemView.extend({
        template: templates.roleEditorEmpty,
        onShow: function onShow() {
            var view = this;
            this.timeout = window.setTimeout(function () {
                view.ui.icon.css({ visibility: "visible" });
            }, 250);
        },
        onClose: function onClose() {
            window.clearTimeout(this.timeout);
        },
        ui: {
            icon: ".icon"
        }
    });

    /**
     * An object that can be used to render and edit all ApplicationRoles
     *
     * @param {Element|jQuery} options.el The element to render the editor into.
     */
    return function (options) {
        if (!options.el) {
            return;
        }
        var $el = $(options.el);
        if (!$el.length) {
            return;
        }
        var region = new Marionette.Region({
            el: $el
        });

        $el.addClass("loading");
        region.show(new ApplicationRoleEditorLoadingView());

        var IO = options.IO || new RolesIO({
            defaultFail: errorHandler
        });

        var collection = new ApplicationRoleCollection([], { IO: IO });

        // eslint-disable-next-line no-unused-expressions
        new ApplicationDefaults(collection);

        collection.whenFetched().then(function () {
            var view = new ApplicationRolesEditorView({
                collection: collection,
                buildRoleEditor: function buildRoleEditor(model) {
                    var id = model.id;
                    return new RoleEditor({
                        data: _.extend(model.toJSON(), {
                            defaultGroupsExistingInAnyOtherRoles: model.defaultGroupsExistingInAnyOtherRoles(),
                            appsAndDefaultRoles: model.appsAndDefaultRoles()
                        }),
                        IO: IO,
                        setRole: function setRole(groups, defaultGroups) {
                            var roleModel = collection.get(model.get("key"));
                            if (roleModel) {
                                var updateDfd = roleModel.update({
                                    id: id,
                                    groups: groups,
                                    defaultGroups: defaultGroups
                                });
                                return updateDfd.then(function (roleModelUpdateResult) {
                                    collection.reload();
                                    return roleModelUpdateResult;
                                });
                            } else {
                                return deferred().reject();
                            }
                        }
                    }).view;
                },
                updateEditors: function updateEditors() {
                    // we need to get snapshot for all applications and update information about seats
                    region.currentView.children.each(function (roleEditor) {
                        var roleKey = roleEditor.model.get("key");
                        var roleData = collection.get(roleKey).toJSON();
                        var roleModel = collection.get(roleKey);
                        if (roleData) {
                            roleEditor.model.set({
                                userCount: roleData.userCount,
                                numberOfSeats: roleData.numberOfSeats,
                                remainingSeats: roleData.remainingSeats,
                                defaultGroupsExistingInAnyOtherRoles: roleModel.defaultGroupsExistingInAnyOtherRoles(),
                                appsAndDefaultRoles: roleModel.appsAndDefaultRoles(),
                                selectedByDefault: roleData.selectedByDefault
                            });
                        }
                    });
                    logger.trace("role.editors.updated");
                }
            });

            region.show(view);
        }).always(function () {
            $el.removeClass("loading");
        });

        var ouload = window.onbeforeunload;
        window.onbeforeunload = function () {
            var result = ouload && ouload.call(window);
            if (!result) {
                if (IO.busy()) {
                    if (!IO.sudoVisible()) {
                        result = formatter.I18n.getText("application.access.configuration.active.ajax");
                    } else {
                        IO.abort();
                    }
                }
            }
            return result || void 0;
        };
    };
});
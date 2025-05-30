define('jira/project/permissions/permissionschememodel', ['jira/backbone-1.3.3', 'jquery', 'underscore', 'jira/project/permissions/permissioncollection', 'jira/project/permissions/permissiongroupmodel', "wrm/context-path"], function (Backbone, $, _, ProjectPermissionCollection, ProjectPermissionGroupModel, wrmContextPath) {
    "use strict";

    /**
     * This represents a group of permissions, such as Project Permissions, Issue Permissions, etc.
     * @typedef {Object} PermissionGroup
     * @property {String} heading - the title for the heading
     * @property {[String]} permissions - names of permissions that would be in group
     * @property {String} sectionType - type of the permission section
     */

    /**
     * @class
     * @extends Backbone.Model
     * @exports jira/project/permissions/permissionschememodel
     * @property {Object} attributes
     * @property {String} attributes.id - Id of the permission scheme
     * @property {String} attributes.name - Name of the permission scheme
     * @property {String} attributes.description - Discription of the permission scheme
     * @property {Object} attributes.displayRendering - contains information about the permission groups
     * @property {Boolean} attributes.displayRendering.readOnly - whether the scheme is read only
     * @property {[PermissionGroup]} attributes.displayRendering.grouping - contains the permission group information
     * @property {[@link module:jira/project/permissions/permissioncollection]} attributes.permissions - Contains
     *           the permissions for this permission scheme
     */

    return Backbone.Model.extend({
        defaults: {
            id: null,
            name: '',
            description: '',
            permissions: [],
            displayRendering: {
                readOnly: true,
                grouping: []
            }
        },

        urlRoot: wrmContextPath() + "/rest/internal/2/managedpermissionscheme/",

        initialize: function initialize(attributes) {
            this.readOnly = attributes.readOnly;
        },

        getGroupModel: function getGroupModel(group) {
            var permissionsForGroup = this.get("permissions").filter(function (permissionModel) {
                return _.contains(group.permissions, permissionModel.get("permissionKey"));
            });

            return new ProjectPermissionGroupModel({
                heading: group.heading,
                permissions: new ProjectPermissionCollection(permissionsForGroup)
            });
        },

        parse: function parse(data) {
            var newData = $.extend({}, data);
            newData.permissions = new ProjectPermissionCollection(data.permissions);
            return newData;
        },

        isReadOnly: function isReadOnly() {
            return this.readOnly;
        }
    });
});
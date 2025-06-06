define('jira/project/permissions/permissionmodel', ['jira/backbone-1.3.3'], function (Backbone) {
    "use strict";

    /**
     * @class
     * @extends Backbone.Model
     * @exports jira/project/permissions/permissionmodel
     * @property {Object} attributes
     * @property {String} attributes.permissionKey - key for the permission
     * @property {String} attributes.permissionName - name of the permission
     * @property {String} attributes.permissionDesc - description for the permission
     * @property {@link module:jira/project/permissions/grantcollection} attributes.grants
     *           - Granted assignments for permission
     * @property {Object} attributes.extPermission - extended permission
     *          (like a child permission with boolean state)
     */

    return Backbone.Model.extend({
        defaults: {
            permissionKey: null,
            permissionName: '',
            permissionDesc: '',
            grants: [],
            extPermission: null
        }
    });
});

define('jira/project/permissions/permissioncollection', ['jira/backbone-1.3.3', 'jira/project/permissions/permissionmodel'], function (Backbone, ProjectPermissionModel) {
    "use strict";

    /**
     * @class
     * @extends Backbone.Collection
     * @exports jira/project/permissions/permissioncollection
     * @property {@link module:jira/project/permissions/permissionmodel} model - of the collection elements
     */

    return Backbone.Collection.extend({
        model: ProjectPermissionModel
    });
});
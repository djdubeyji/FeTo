define('jira/field/create-user-picker-popup-trigger', ['exports'], function (exports) {
    'use strict';

    /**
     * @param {Object} options
     * @param {String} options.fieldName - name and ID of the field that will be updated
     * @param {String} options.urlBase - URL to open
     * @param {String} [options.formName] - form name. Defaults to closest form
     * @param {Boolean} [options.multiSelect=false] - multi select or single. Default: single
     * @param {String} [options.actionToOpen] - action to open. Defaults to user picker popup
     * @param {String} [options.fieldConfigId] - field config id
     * @param {String} [options.triggerEvent] - event fired when a choice is made
     * @param {Array} [options.projectIds] - ids of the projects to filter users
     * @constructs
     * @override
     */

    exports.createUserPickerPopupTrigger = function createUserPickerPopupTrigger(_ref) {
        var urlBase = _ref.urlBase,
            formName = _ref.formName,
            fieldName = _ref.fieldName,
            actionToOpen = _ref.actionToOpen,
            multiSelect = _ref.multiSelect,
            fieldConfigId = _ref.fieldConfigId,
            triggerEvent = _ref.triggerEvent,
            projectIds = _ref.projectIds;

        return function (e) {
            var vWinUsers;
            var url = urlBase;

            e.preventDefault();

            if (actionToOpen) {
                url = url + actionToOpen;
            } else {
                url = url + '/secure/popups/UserPickerBrowser.jspa';
            }

            url += '?formName=' + formName;
            url += '&multiSelect=' + Boolean(multiSelect);
            url += '&decorator=popup';
            url += '&element=' + fieldName;

            if (fieldConfigId) {
                url += '&fieldConfigId=' + fieldConfigId;
            }
            if (projectIds) {
                projectIds = [].concat(projectIds);
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = projectIds[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var projectId = _step.value;

                        url += '&projectId=' + projectId;
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            }

            if (triggerEvent) {
                url += '&triggerEvent=' + triggerEvent;
            }

            vWinUsers = window.open(url, 'UserPicker', 'status=yes,resizable=yes,top=100,left=100,width=800,height=750,scrollbars=yes');
            vWinUsers.opener = self;
            vWinUsers.focus();
        };
    };
});
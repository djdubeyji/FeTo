define('jira/field/assignee-picker', ['jira/util/formatter', 'jira/ajs/select/single-select', 'jira/ajs/select/suggestions/assignee-suggest-handler', 'jira/ajs/list/group-descriptor', 'jira/ajs/list/item-descriptor', 'wrm/context-path', 'aui/params', 'jquery'], function (formatter, SingleSelect, AssigneeSuggestHandler, GroupDescriptor, ItemDescriptor, wrmContextPath, params, $) {
    'use strict';

    var contextPath = wrmContextPath();

    /**
     * A single-select list for selecting Assignees. Assignees in the list are in two groups:
     *
     * - Suggestions: local data, consisting of recent assignees for the issue and current
     *                user, plus the reporter
     * - Search: AJAX data, found from all user assignable for the current project
     *
     * @class AssigneePicker
     * @extends SingleSelect
     */
    return SingleSelect.extend({
        /**
         * @param {Object} options
         * @constructs
         */
        init: function init(options) {
            var element = options.element instanceof $ ? options.element : $(options.element);

            // Unlike the legacy endpoint, the new one is ignoring Browse Users permissions. See:
            var isIgnoreBrowseUsersPermissionFeatureFlagTurnedOn = !!element.data('use-new-endpoint');
            // Returns the data sent to the server for the AJAX search
            function getData(query) {
                params.actionDescriptorId = undefined;

                AJS.populateParameters();

                var requestData = {
                    issueKey: params.assigneeEditIssueKey,
                    actionDescriptorId: params.actionDescriptorId,
                    maxResults: 100
                };

                if (!isIgnoreBrowseUsersPermissionFeatureFlagTurnedOn || !params.assigneeEditIssueKey) {
                    requestData.projectKeys = params.projectKeys;
                }

                if (isIgnoreBrowseUsersPermissionFeatureFlagTurnedOn) {
                    requestData.query = query;
                } else {
                    requestData.username = query;
                }

                return requestData;
            }

            function getUrl() {
                // reset the assigneeEditIssueKey param, so that when we go from an quickedit dialog to a quick create dialog for
                // example the value isn't set!
                params.assigneeEditIssueKey = undefined;
                AJS.populateParameters();

                if (isIgnoreBrowseUsersPermissionFeatureFlagTurnedOn) {
                    return '' + contextPath + (params.assigneeEditIssueKey ? '/rest/internal/2/users/assignee' : '/rest/internal/2/users/assignee/multiProjectSearch');
                }

                var path = params.assigneeEditIssueKey ? 'search' : 'multiProjectSearch';
                return contextPath + '/rest/api/latest/user/assignable/' + path;
            }

            function formatResponse(response) {
                var ret = [];
                var users = isIgnoreBrowseUsersPermissionFeatureFlagTurnedOn ? response.users : response;

                if (!users || users.length === 0) {
                    return ret;
                }

                // Search results
                var groupDescriptor = new GroupDescriptor({
                    weight: 1, // index of group in dropdown
                    id: 'assignee-group-search',
                    uniqueItemScope: 'container',
                    replace: true, // Allow subsequent calls to replace model items
                    label: formatter.I18n.getText('assignee.picker.group.search')
                });

                for (var i = 0, len = users.length; i < len; i++) {
                    var user = users[i];

                    var username = user.name;
                    var displayName = user.displayName;
                    var emailAddress = user.emailAddress;
                    var label = displayName;
                    if (emailAddress) {
                        label += ' - ' + emailAddress;
                    }
                    label += ' (' + username + ')';

                    groupDescriptor.addItem(new ItemDescriptor({
                        value: username,
                        fieldText: displayName,
                        label: label,
                        allowDuplicate: true,
                        icon: isIgnoreBrowseUsersPermissionFeatureFlagTurnedOn ? user.avatarUrl : user.avatarUrls['16x16'],
                        iconType: 'rounded'
                    }));
                }
                ret.push(groupDescriptor);

                return ret;
            }

            options = $.extend(true, {}, {
                submitInputVal: true,
                showDropdownButton: !!element.data('show-dropdown-button'),
                errorMessage: formatter.I18n.getText('assignee.picker.invalid.user'),
                localDataGroupId: 'assignee-group-suggested',
                content: 'mixed',
                iconType: 'rounded',
                suggestionAtTop: true,
                removeDuplicates: false,
                disableRemoveSelected: true,
                ajaxOptions: {
                    url: getUrl(),
                    minQueryLength: 0,
                    data: getData,
                    formatResponse: formatResponse
                }
            }, options);

            if (options.editValue === '-1') {
                // override value in 'data-editValue' for SingleSelect._setOptions -> getOptionsFromAttributes()
                // so on error the 'Automatic' is selected instead of verbatim '-1' string in SingleSelect._setInitState
                options.editValue = false;
                element.val('-1');
            }

            this._super(options);
            this.suggestionsHandler = new AssigneeSuggestHandler(this.options, this.model);
        },

        /**
         * Handle the case where the entry was deleted - on blur, set the Assignee to 'Automatic'.
         */
        handleFreeInput: function handleFreeInput(value) {
            if ('' === $.trim(value || this.$field.val())) {
                this.setSelection(this.model.getDescriptor('-1'));
            } else {
                this._super(value);
            }
            this.lastQuery = this.getQueryVal();
        },

        /**
         * Only handle when the query is changed
         */
        _handleCharacterInput: function _handleCharacterInput(force) {
            if (this.lastQuery !== this.getQueryVal()) {
                this._super(force);
            } else if (force) {
                this.showSuggestions();
            }
            this.lastQuery = this.getQueryVal();
        },

        /**
         * Assignee Picker is a special case as we have <option>s that are prepopulated and ones that are requested from the
         * server. Our super class will remove all of our <option>s whenever we make a new request as it is expecting that
         * because we go to the server all our <option>s will be populated from the server also. This is not the case
         * overriding this method fixes this issue. If we do not override we get JRADEV-8626.
         */
        cleanUpModel: function cleanUpModel() {}
    });
});

AJS.namespace('JIRA.AssigneePicker', null, require('jira/field/assignee-picker'));
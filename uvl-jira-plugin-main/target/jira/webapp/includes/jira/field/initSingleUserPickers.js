define('jira/field/init-single-user-pickers', ['jquery', 'wrm/context-path', 'aui/params', 'jira/ajs/select/single-select', 'jira/util/events/reasons', 'jira/util/events/types', 'jira/util/events', 'jira/field/user-picker-util', 'jira/util/formatter', 'jira/field/create-user-picker-popup-trigger', 'jira/ajs/list/item-descriptor'], function (jQuery, wrmContextPath, params, SingleSelect, Reasons, Types, Events, UserPickerUtil, formatter, userPopup, ItemDescriptor) {
    'use strict';

    var contextPath = wrmContextPath();
    var MAX_RESULTS = 100;

    function isCustomField(name) {
        return name && name.indexOf('customfield_') !== -1;
    }

    /**
     * This function retrieves the project keys
     *
     * Obtaining project keys from aui params takes precedence (to cover bulk edit case). If they are not available
     * we fallback to data attribute that contains single project key (e.g. in issue view context).
     *
     * @function
     * @param {jQuery} $element
     * @returns {string}
     */
    function getProjectKeys($element) {
        return params.projectKeys ? params.projectKeys : $element.data('project-key');
    }

    function createSingleUserPickers(ctx) {
        jQuery('.js-default-user-picker', ctx).each(function () {
            var $userPicker = jQuery(this);
            if ($userPicker.data('aui-ss')) {
                return;
            }
            var isCustom = isCustomField($userPicker.attr('name'));

            AJS.populateParameters();
            var useNewEndpoint = $userPicker.data('use-new-endpoint') === true && Boolean(getProjectKeys($userPicker));
            var getData = function getData() {
                return {
                    showAvatar: useNewEndpoint ? undefined : true,
                    fieldName: isCustom ? $userPicker.prop('name') : undefined,
                    fieldConfigId: isCustom ? $userPicker.data('field-config-id') : undefined,
                    projectId: isCustom ? $userPicker.data('project-ids').split(',').filter(function (x) {
                        return x;
                    }) : undefined,
                    maxResults: useNewEndpoint ? MAX_RESULTS : undefined,
                    projectKeys: useNewEndpoint ? getProjectKeys($userPicker) : undefined
                };
            };
            var inputText = $userPicker.data('inputValue');

            if ($userPicker.data('has-popup-picker')) {
                $userPicker.next('.popup-trigger').on('click', userPopup.createUserPickerPopupTrigger({
                    urlBase: contextPath,
                    formName: $userPicker.data('form-name') || $userPicker.closest('form').attr('name'),
                    fieldName: $userPicker.prop('name'),
                    fieldConfigId: $userPicker.data('field-config-id'),
                    projectIds: $userPicker.data('project-ids') ? $userPicker.data('project-ids').split(',').filter(function (x) {
                        return x;
                    }) : undefined,
                    triggerEvent: 'userpicker:onPopUpSelection'
                }));
            }

            new SingleSelect({
                element: $userPicker,
                submitInputVal: true,
                hasAddonIcon: !!$userPicker.data('has-popup-picker'),
                showDropdownButton: !!$userPicker.data('show-dropdown-button'),
                errorMessage: formatter.I18n.getText('user.picker.invalid.user', "'{0}'"),
                iconType: 'rounded',
                ajaxOptions: {
                    url: UserPickerUtil.getUrl(isCustom, useNewEndpoint, $userPicker.prop('name')),
                    data: getData(),
                    formatResponse: useNewEndpoint ? UserPickerUtil.formatResponseWithoutHTML : UserPickerUtil.formatResponse
                },
                inputText: inputText,
                ariaLabel: formatter.I18n.getText('user.picker.select.user'),
                events: {
                    element: {
                        // eslint-disable-next-line no-unused-vars
                        'userpicker:onPopUpSelection': function userpickerOnPopUpSelection(event, $select, instance, value) {
                            jQuery.ajax({
                                url: contextPath + '/rest/api/2/user?username=' + value,
                                type: 'GET',
                                contentType: 'application/json',
                                success: function success(user) {
                                    instance.setSelection(new ItemDescriptor({
                                        value: value,
                                        label: user.displayName,
                                        icon: user.avatarUrls['24x24']
                                    }), true);
                                },
                                error: function error(err) {
                                    return console.error(err);
                                }
                            });
                        }
                    }
                }
            });
        });
    }

    Events.bind(Types.NEW_CONTENT_ADDED, function (e, context, reason) {
        //eslint-disable-line @atlassian/jira-event-checks/no-newcontentadded-handlers
        if (reason !== Reasons.panelRefreshed) {
            createSingleUserPickers(context);
        }
    });

    return createSingleUserPickers;
});
define('jira/field/init-multi-user-pickers', ['jquery', 'wrm/context-path', 'jira/ajs/select/multi-select', 'jira/util/events/reasons', 'jira/util/events/types', 'jira/util/events', 'jira/field/no-browser-user-name-picker', 'jira/field/user-picker-util', 'jira/ajs/list/item-descriptor', 'jira/field/create-user-picker-popup-trigger', 'jira/util/logger'], function (jQuery, wrmContextPath, MultiSelect, Reasons, Types, Events, NoBrowseUserNamePicker, UserPickerUtil, ItemDescriptor, userPopup, logger) {
    'use strict';

    var contextPath = wrmContextPath();

    /**
     * We allow to turn off rich MultiSelect and use textarea instead.
     * This is to support WebDriver tests and provide feature flag in case MultiSelect does not work.
     * It will happen only if frother config option is set explicitly to false.
     *
     * @param frotherConfig {boolean}
     * @returns {boolean}
     * @see JiraFeatureFlagRegistrar.NO_FROTHER_MULTIUSERPICKER to disable autocomplete in multi user picker cf
     */
    function isFrothered(frotherConfig) {
        return frotherConfig !== false;
    }

    /**
     *
     * @param data {boolean|undefined|string}
     * @returns {string[]|undefined} - list of project ids
     */
    function getProjectIds(data) {
        if (data) {
            return String(data).split(',').filter(function (projectId) {
                return projectId;
            });
        }
        return undefined;
    }

    /**
     *
     * @param $element {jQuery}
     * @returns params {AutoCompleteParams}
     */
    function parseParams($element) {
        return {
            useFrotherControl: $element.data('use-frother-control'),
            userPickerEnabled: $element.data('user-picker-enabled'),
            fieldName: $element.data('field-name'),
            formName: $element.data('form-name'),
            fieldConfigId: $element.data('field-config-id'),
            multiSelect: $element.data('multi-select'),
            projectId: getProjectIds($element.data('project-id')),
            actionToOpen: $element.data('action-to-open')
        };
    }

    /**
     * Used to display multi user custom field and some other user-related multi user pickers.
     * @param ctx {jQuery}
     */
    function initMultiUserPicker(ctx) {
        ctx.find('.js-default-multi-user-picker').each(function () {
            var $element = jQuery(this);
            var id = $element.attr('id');
            var $popupTriggerElement = ctx.find('#' + id + '_container').find('.popup-trigger');
            var params = parseParams($element);

            if ($popupTriggerElement.length > 0) {
                initPopupTrigger($popupTriggerElement, params);
            }
            if (isFrothered(params.useFrotherControl)) {
                if (params.userPickerEnabled) {
                    initMultiSelect($element, params);
                } else {
                    initNoBrowseUserNamePicker($element);
                }
            }
        });
    }

    /**
     * @param $element {HTMLElement|string|jQuery} - DOM element to apply picker to
     */
    function initNoBrowseUserNamePicker($element) {
        new NoBrowseUserNamePicker({
            element: $element
        });
    }

    /**
     * @param $element {HTMLElement|string|jQuery} - DOM element to apply picker to
     * @param params {AutoCompleteParams} - options
     */
    function initMultiSelect($element, params) {
        new MultiSelect({
            element: $element,
            itemAttrDisplayed: 'label',
            showDropdownButton: false,
            removeOnUnSelect: true,
            submitInputVal: true,
            events: {
                element: {
                    'userpicker:onPopUpSelection': function userpickerOnPopUpSelection(event, $select, instance, value) {
                        try {
                            var selectedUsers = JSON.parse(value);
                            selectedUsers.forEach(function (_ref) {
                                var id = _ref.id,
                                    displayName = _ref.displayName;

                                instance.addItem(new ItemDescriptor({
                                    value: id,
                                    title: displayName,
                                    label: displayName
                                }));
                            });
                        } catch (e) {
                            logger.error('Cannot parse user names');
                        }
                    }
                }
            },
            ajaxOptions: {
                url: contextPath + '/rest/api/1.0/users/picker',
                data: function data(query) {
                    return {
                        showAvatar: true,
                        query: query,
                        exclude: $element.val(),
                        fieldName: params.fieldName,
                        fieldConfigId: params.fieldConfigId,
                        projectId: params.projectId
                    };
                },
                formatResponse: UserPickerUtil.formatResponse
            }
        });
    }

    /**
     *
     * @param $element {jQuery}
     * @param params {AutoCompleteParams}
     */
    function initPopupTrigger($element, params) {
        $element.on('click', userPopup.createUserPickerPopupTrigger({
            urlBase: contextPath,
            formName: params.formName || $element.closest('form').attr('name'),
            fieldName: params.fieldName,
            multiSelect: params.multiSelect,
            fieldConfigId: params.fieldConfigId,
            projectIds: params.projectId,
            actionToOpen: params.actionToOpen,
            triggerEvent: isFrothered(params.useFrotherControl) ? 'userpicker:onPopUpSelection' : undefined
        }));
    }

    Events.bind(Types.NEW_CONTENT_ADDED, function (e, context, reason) {
        //eslint-disable-line @atlassian/jira-event-checks/no-newcontentadded-handlers
        if (reason !== Reasons.panelRefreshed) {
            initMultiUserPicker(context);
        }
    });

    return initMultiUserPicker;
});
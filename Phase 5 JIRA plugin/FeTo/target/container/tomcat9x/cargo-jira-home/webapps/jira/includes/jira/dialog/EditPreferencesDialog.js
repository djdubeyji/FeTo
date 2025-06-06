define('jira/dialog/edit-preferences-dialog', ['jira/dialog/user-profile-dialog', 'jquery'], function (UserProfileDialog, jQuery) {
    'use strict';

    /**
     * @class EditPreferencesDialog
     * @extends UserProfileDialog
     */

    return UserProfileDialog.extend({
        _getDefaultOptions: function _getDefaultOptions() {
            return jQuery.extend(this._super(), {
                notifier: "#userprofile-notify"
            });
        },
        _handleSubmitResponse: function _handleSubmitResponse(data, xhr, smartAjaxResult) {
            if (this.serverIsDone) {
                this._updatePageSize();
                this._updateEmail();
                this._updateSharing();
                this._updateOwnNotifications();
                // We update this last, because if there any updates we need to reload the page so that they are picked up
                // immediately. We override the magical "reload" function to true so that the super-class knows it needs to reload
                // the page. Damn it! I hate inheritance hierarchies.
                this._updateLocale();
                this._updateTimezone();
                this._updateKeyboardShortcutsNotifications();
                this._updateAutowatch();
                this._updateExternalLinks();
                this._updateQuickSearchingMode();
                this._super(data, xhr, smartAjaxResult);
            }
        },
        _updatePageSize: function _updatePageSize() {
            var pageSize = jQuery("#update-user-preferences-pagesize").val();
            jQuery("#up-p-pagesize").text(pageSize);
        },
        _updateEmail: function _updateEmail() {
            var email = jQuery("option:selected", "#update-user-preferences-mailtype").text();
            jQuery("#up-p-mimetype").text(email);
        },
        _updateSharing: function _updateSharing() {
            var sharing = jQuery("option:selected", "#update-user-preferences-sharing").val();
            if (sharing !== "false") {
                jQuery("#up-p-share-private").show();
                jQuery("#up-p-share-public").hide();
            } else {
                jQuery("#up-p-share-private").hide();
                jQuery("#up-p-share-public").show();
            }
        },
        _updateOwnNotifications: function _updateOwnNotifications() {
            var ownNotifications = jQuery("option:selected", "#update-user-preferences-own-notifications").val();
            if (ownNotifications !== "false") {
                jQuery("#up-p-notifications_on").show();
                jQuery("#up-p-notifications_off").hide();
            } else {
                jQuery("#up-p-notifications_on").hide();
                jQuery("#up-p-notifications_off").show();
            }
        },
        _updateLocale: function _updateLocale() {
            var localeNewValue = jQuery.trim(jQuery("option:selected", "#update-user-preferences-locale").text());
            var localeOldValue = jQuery.trim(jQuery("#up-p-locale").text());

            if (localeOldValue !== localeNewValue) {
                this._reload = function () {
                    return true;
                };
            }
        },
        _updateTimezone: function _updateTimezone() {
            var current = jQuery("option:selected", "#defaultUserTimeZone");
            var timeZoneNewValue = jQuery.trim(current.text());

            var timeZoneRegion = current.val();

            if (timeZoneRegion !== 'JIRA') {
                jQuery("#up-p-jira-default").hide();
            } else {
                jQuery("#up-p-jira-default").show();
            }
            jQuery("#up-p-timezone-label").text(timeZoneNewValue);
        },
        _updateKeyboardShortcutsNotifications: function _updateKeyboardShortcutsNotifications() {
            var kbShortcutsNewValue = jQuery("option:selected", "#update-user-preferences-keyboard-shortcuts").val();
            var kbShortcutsOldValue = jQuery("#up-p-keyboard-shortcuts-enabled").is(":visible") ? "true" : "false";

            if (kbShortcutsOldValue !== kbShortcutsNewValue) {
                if (kbShortcutsNewValue !== "false") {
                    jQuery("#up-p-keyboard-shortcuts-enabled").show();
                    jQuery("#up-p-keyboard-shortcuts-disabled").hide();
                } else {
                    jQuery("#up-p-keyboard-shortcuts-enabled").hide();
                    jQuery("#up-p-keyboard-shortcuts-disabled").show();
                }
                this._reload = function () {
                    return true;
                };
            }
        },
        _updateAutowatch: function _updateAutowatch() {
            var autowatchValue = jQuery("option:selected", "#update-user-preferences-autowatch").val();
            if (autowatchValue !== 'false') {
                jQuery("#up-p-autowatch-enabled").show();
                jQuery("#up-p-autowatch-disabled").hide();
            } else {
                jQuery("#up-p-autowatch-enabled").hide();
                jQuery("#up-p-autowatch-disabled").show();
            }
        },

        _updateExternalLinks: function _updateExternalLinks() {
            var externalLinksSetting = jQuery('#update-user-preferences-external-links-new-window').val() === 'true';
            if (externalLinksSetting) {
                jQuery('#up-p-external-links-enabled').show();
                jQuery('#up-p-external-links-disabled').hide();
            } else {
                jQuery('#up-p-external-links-enabled').hide();
                jQuery('#up-p-external-links-disabled').show();
            }
        },

        _updateQuickSearchingMode: function _updateQuickSearchingMode() {
            var quickSearchingMode = jQuery('#update-user-preferences-quick-search-preference').val();
            if (quickSearchingMode === 'smartquery') {
                jQuery('#up-p-quicksearching-mode-smartquery').show();
                jQuery('#up-p-quicksearching-mode-text').hide();
            } else {
                jQuery('#up-p-quicksearching-mode-smartquery').hide();
                jQuery('#up-p-quicksearching-mode-text').show();
            }
        }
    });
});

AJS.namespace('JIRA.EditPreferencesDialog', null, require('jira/dialog/edit-preferences-dialog'));
define('jira/userhover/userhover', ['jira/ajs/dropdown/dropdown-factory', 'aui/inline-dialog', 'wrm/context-path', 'jquery', 'jira/util/assistive', 'jira/util/formatter'], function (DropdownFactory, InlineDialog, wrmContextPath, jQuery, Assistive, formatter) {
    'use strict';

    var contextPath = wrmContextPath();

    /**
     * Inline dialogs for user infomation:
     *
     * @addon JIRA.userhover
     *   -- To reduce unneeded HTTP requests (JRADEV-2207) we need to circumvent AJS.InlineDialog's default
     *      behaviour. Thus, we use the noBind = true option, and manually control when to show/hide the
     *      dialog popups.
     */
    var userhover = function userhover() {};

    var SHOW_HIDE_DELAY_MS = 400;
    var DATA_KEYS = {
        dialog: "AJS.InlineDialog",
        hasUserAttention: "AJS.InlineDialog.hasUserAttention",
        delayId: "AJS.InlineDialog.delayId",
        isFetchingContent: "AJS.InlineDialog.isFetchingContent",
        focusHandler: "AJS.InlineDialog.focusHandler"
    };

    // Is set to "true" when interacting with the popup, e.g. an inner dropdown is open.
    userhover._isLocked = false;

    userhover.INLINE_DIALOG_OPTIONS = {
        urlPrefix: contextPath + "/secure/ViewUserHover!default.jspa?decorator=none&username=",
        showDelay: SHOW_HIDE_DELAY_MS,
        closeOthers: false,
        offsetX: -10,
        addActiveClass: false,
        noBind: true,
        hideCallback: function hideCallback() {
            var options = this.popup.getOptions();
            userhover.hide(options.trigger, options.isHoverLogicDisabled);
        }
    };

    function _createFocusHandler(dialogId) {
        return function (e) {
            if (e.key !== "Tab") {
                return;
            }
            var activeElement = document.activeElement;
            var focusableElements = jQuery("#inline-dialog-" + dialogId).find(":focusable:visible:not([tabindex='-1'])");
            var firstElement = focusableElements[0];
            var lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey && activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            } else if (!e.shiftKey && activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        };
    }

    userhover._showDialog = function (trigger, noDelay, isHoverLogicDisabled) {
        var dialogOptions = {};
        if (isHoverLogicDisabled) {
            var additionalOptions = {
                isHoverLogicDisabled: true,
                shouldFocusTriggerOnClose: true,
                showDelay: noDelay ? 0 : userhover.INLINE_DIALOG_OPTIONS.showDelay
            };
            dialogOptions = Object.assign(userhover.INLINE_DIALOG_OPTIONS, additionalOptions);
        }

        dialogOptions.trigger = trigger;
        var dialogId = "user-hover-dialog-" + new Date().getTime();
        var dialog = new InlineDialog(jQuery(trigger), dialogId, function ($contents, _, showPopup) {
            // Call the InlineDialog's url function with its expected arguments.
            userhover._fetchDialogContents($contents, trigger, showPopup, dialogId, isHoverLogicDisabled);
        }, dialogOptions);
        jQuery.data(trigger, DATA_KEYS.dialog, dialog).show();
    };

    userhover.show = function (trigger, noDelay, isHoverLogicDisabled) {
        clearTimeout(jQuery.data(trigger, DATA_KEYS.delayId) || 0);
        jQuery.data(trigger, DATA_KEYS.hasUserAttention, true);

        if (jQuery.data(trigger, DATA_KEYS.dialog) || userhover._isLocked || AJS.params.loggedInUser === "") {
            return;
        }

        if (!noDelay) {
            jQuery.data(trigger, DATA_KEYS.delayId, setTimeout(function () {
                userhover._showDialog(trigger, false, isHoverLogicDisabled);
            }, SHOW_HIDE_DELAY_MS));
        } else {
            userhover._showDialog(trigger, noDelay, isHoverLogicDisabled);
        }
    };

    userhover._hideDialog = function (trigger, dialog) {
        if (dialog.getOptions().shouldFocusTriggerOnClose) {
            setTimeout(function () {
                jQuery(trigger).focus();
            });
        }
        dialog.remove();
        var handleFocus = jQuery.data(trigger, DATA_KEYS.focusHandler);
        jQuery.data(trigger, DATA_KEYS.focusHandler, null);
        document.removeEventListener("keydown", handleFocus);
        jQuery.data(trigger, DATA_KEYS.dialog, null);
    };

    userhover.hide = function (trigger, noDelay) {
        if (jQuery.data(trigger, DATA_KEYS.isFetchingContent) || userhover._isLocked) {
            return;
        }
        clearTimeout(jQuery.data(trigger, DATA_KEYS.delayId) || 0);
        jQuery.data(trigger, DATA_KEYS.hasUserAttention, false);

        var dialog = jQuery.data(trigger, DATA_KEYS.dialog);
        if (!dialog) {
            return;
        }

        if (!noDelay) {
            jQuery.data(trigger, DATA_KEYS.delayId, setTimeout(function () {
                userhover._hideDialog(trigger, dialog);
            }, SHOW_HIDE_DELAY_MS));
        } else {
            userhover._hideDialog(trigger, dialog);
        }
    };

    userhover.toggle = function (trigger, noDelay) {
        if (jQuery.data(trigger, DATA_KEYS.dialog)) {
            userhover.hide(trigger, noDelay);
        } else {
            userhover.show(trigger, noDelay, true);
        }
    };

    userhover._setupDialogContents = function ($contents, html, trigger) {
        $contents.html(html);
        var $closeButton = jQuery("<button class='aui-button aui-button-text aui-button-close user-hover-close'><span class='aui-icon aui-icon-small aui-iconfont-close-dialog'></span></button>");
        $closeButton.attr("aria-label", formatter.I18n.getText("common.words.close"));
        $closeButton.on("click keydown", function (e) {
            Assistive.handleClickSpaceEnter(e, function () {
                userhover.hide(trigger, true);
            });
        });
        $contents.append($closeButton);
        $contents.css({
            overflow: "visible",
            position: "relative"
        });

        $contents.parent().attr({
            role: "dialog",
            "aria-label": formatter.I18n.getText("user.hover.tooltip.aria.label")
        });

        var moreActionsDropdown = DropdownFactory.createDropdown({
            trigger: $contents.find(".aui-dd-link"),
            content: $contents.find(".aui-list")
        });
        jQuery(moreActionsDropdown).bind({
            "showLayer": function showLayer() {
                userhover._isLocked = true;
            },
            "hideLayer": function hideLayer() {
                userhover._isLocked = false;
                if (!jQuery.data(trigger, DATA_KEYS.hasUserAttention)) {
                    userhover.hide(trigger);
                }
            }
        });
    };

    userhover._fetchDialogContents = function ($contents, trigger, showPopup, dialogId, isHoverLogicDisabled) {
        var url = userhover.INLINE_DIALOG_OPTIONS.urlPrefix + encodeURIComponent(trigger.getAttribute("rel"));
        jQuery.data(trigger, DATA_KEYS.isFetchingContent, true);
        jQuery.get(url, function (html) {
            if (!jQuery.data(trigger, DATA_KEYS.hasUserAttention)) {
                jQuery.data(trigger, DATA_KEYS.isFetchingContent, false);
                return;
            }

            userhover._setupDialogContents($contents, html, trigger);

            jQuery.data(trigger, DATA_KEYS.isFetchingContent, false);
            showPopup();

            var handleFocus = _createFocusHandler(dialogId);
            document.addEventListener("keydown", handleFocus);
            jQuery.data(trigger, DATA_KEYS.focusHandler, handleFocus);

            if (isHoverLogicDisabled) {
                setTimeout(function () {
                    $contents.find("#avatar-image-link").focus();
                });
            } else {
                // Wait for the popup's show animation to complete before binding event handlers
                // on $contents. This ensures the popup doesn't get in the way when the mouse
                // moves over it quickly.
                jQuery.data(trigger, DATA_KEYS.delayId, setTimeout(function () {
                    $contents.bind({
                        "mousemove": function mousemove() {
                            userhover.show(trigger);
                        },
                        "mouseleave": function mouseleave() {
                            userhover.hide(trigger);
                        }
                    });
                }, SHOW_HIDE_DELAY_MS));
            }
        });
    };

    return userhover;
});

/** Preserve legacy namespace
    @deprecated jira.app.userhover */
AJS.namespace("jira.app.userhover", null, require('jira/userhover/userhover'));
AJS.namespace('JIRA.userhover', null, require('jira/userhover/userhover'));
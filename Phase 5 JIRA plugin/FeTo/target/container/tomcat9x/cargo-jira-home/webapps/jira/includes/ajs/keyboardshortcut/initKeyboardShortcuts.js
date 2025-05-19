define('jira/ajs/keyboardshortcut/init-keyboard-shortcut', ['jira/ajs/keyboardshortcut/keyboard-shortcut', 'jira/ajs/keyboardshortcut/keyboard-shortcut-toggle', 'jira/util/data/meta', 'jira/dialog/dialog-stack', 'aui/dropdown', 'aui/popup', 'jira/jquery/deferred', 'jquery', 'wrm/data'], function (KeyboardShortcut, KeyboardShortcutToggle, Meta, DialogStack, AuiDropdown, AuiPopup, Deferred, jQuery, wrmData) {

    'use strict';

    var keyboardShortcutDeferred = new Deferred();
    var initKeyboardShortcut = {};

    Object.defineProperty(initKeyboardShortcut, 'keyboardShortcuts', {
        value: keyboardShortcutDeferred.promise(),
        writable: false,
        configurable: false
    });

    function setupKeyboardShortcuts(keyboardShortcutsUrl) {
        fetch(keyboardShortcutsUrl).then(function (resp) {
            return resp.json();
        }).then(function (keyboardShortcut) {
            AJS.activeShortcuts = KeyboardShortcut.fromJSON(keyboardShortcut.shortcuts);
            keyboardShortcutDeferred.resolve(AJS.activeShortcuts);
        }).catch(function (err) {
            return console.error("There was an error during the setup of keyboard shortcuts.", err);
        });
    }

    jQuery(function () {
        // eslint-disable-line @atlassian/onready-checks/no-jquery-onready
        /**
         * Ignore keyboard shortcuts when we have a dialog, dropdown etc shown.
         */
        KeyboardShortcut.addIgnoreCondition(function () {
            return AuiPopup.current || AuiDropdown.current || DialogStack.current || KeyboardShortcutToggle.areKeyboardShortcutsDisabled();
        });

        if (Meta.get("keyboard-shortcuts-enabled")) {
            KeyboardShortcutToggle.enable();
        } else {
            KeyboardShortcutToggle.disable();
        }
        wrmData.claim('keyboardShortcutsUrl', setupKeyboardShortcuts);
    });

    // Blur field when ESC key is pressed.
    jQuery(document).bind("aui:keyup", function (event) {
        var $target;
        var beforeBlurInput;

        // Short-circuit quickly if the key wasn't the escape key.
        if (event.key !== "Esc") {
            return;
        }

        $target = jQuery(event.target);
        if ($target.is(":input:not(button[type='button'])")) {
            // Fire beforeBlurInput event to give inputs a chance to prevent blurring
            beforeBlurInput = new jQuery.Event("beforeBlurInput");
            $target.trigger(beforeBlurInput, [{
                reason: "escPressed"
            }]);
            if (!beforeBlurInput.isDefaultPrevented()) {
                $target.blur();
            }
        }
    });
    return initKeyboardShortcut;
});
require('jira/ajs/keyboardshortcut/init-keyboard-shortcut');
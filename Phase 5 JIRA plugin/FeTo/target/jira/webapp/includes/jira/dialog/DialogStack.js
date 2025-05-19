/**
 * A simple value holder for Jira Dialog's stacking props, e.g. `Dialog.current`.
 * Rationale: decomposition and not relying on `jira/dialog/dialog`.current directly (or `jira/dialog/dialog2`.current).
 *
 * @module jira/dialog/dialog-stack
 */
define('jira/dialog/dialog-stack', [], function () {
    'use strict';

    var current = undefined;
    var stackroot = undefined;
    var originalWindowTitle = undefined;

    var o = {};
    /**
     * Long-term shouldn't be used outside Dialog implementations (migrate to AUI Dialog2 or AK).
     * Till then, should be used instead of a direct usage of JiraDialog.current.
     */
    Object.defineProperty(o, 'current', {
        get: function get() {
            return current;
        },
        set: function set(newValue) {
            current = newValue;
        }
    });
    /**
     * Shouldn't be used outside Dialog implementations.
     * @private
     */
    Object.defineProperty(o, 'stackroot', {
        get: function get() {
            return stackroot;
        },
        set: function set(newValue) {
            stackroot = newValue;
        }
    });
    /**
     * Shouldn't be used outside Dialog implementations.
     * @private
     */
    Object.defineProperty(o, 'originalWindowTitle', {
        get: function get() {
            return originalWindowTitle;
        },
        set: function set(newValue) {
            originalWindowTitle = newValue;
        }
    });

    // legacy
    o.currentDeprecationMsg = '[deprecated] migrate to AUI dialog2 or use `current` prop from `jira/dialog/dialog-stack` module';

    return o;
});
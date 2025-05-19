/**
 * Utility functions for document-level event binding and handling.
 * @module jira/util/events
 * @see module:jira/util/events/reasons
 * @see module:jira/util/events/types
 */
define('jira/util/events', ['jquery', 'jira/util/logger', 'exports'], function (jQuery, logger, exports) {
    'use strict';

    var ctx = jQuery(document);

    var handlersRegistry = new WeakMap();

    /**
     * Subscribes to events
     *
     * @param types
     * @param data
     * @param fn
     */
    exports.bind = function (types, data, fn) {
        ctx.bind(types, isolateCallback(data), isolateCallback(fn));
    };

    /**
     * Bind to an event once
     *
     * @param evt
     * @param handler
     */
    exports.one = function (evt, handler) {
        ctx.one(evt, isolateCallback(handler));
    };

    /**
     * Unbind an event
     *
     * @param evt
     * @param handler
     */
    exports.unbind = function (evt, handler) {
        var registeredHandler = handlersRegistry.get(handler);
        ctx.unbind(evt, registeredHandler ? registeredHandler : handler);
    };

    /**
     * Publishes events
     *
     * @param evt
     * @param args
     */
    exports.trigger = function (evt, args) {
        ctx.trigger(evt, args);
    };

    /**
     * Wraps provided function in try/catch to isolate handlers' execution.
     * Wrapping preserves params, a return value, and the context.
     * Additionally, the original and wrapped fns are put into the registry for later retrieval.
     * Non-function param is passed through.
     *
     * A side-note: we should not use jQuery for our simple event bus,
     *              at least not exposing jQuery API and behaviour through this module...
     *
     * @param {T} maybeFn
     * @returns {T}
     */
    function isolateCallback(maybeFn) {
        if (typeof maybeFn === 'function') {
            var isolated = function isolatedCallback() {
                try {
                    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                        args[_key] = arguments[_key];
                    }

                    return maybeFn.apply(this, args);
                } catch (e) {
                    logger.error('An error occurred in one of the callback passed to jira/util/events', e);
                }
            };

            handlersRegistry.set(maybeFn, isolated);
            return isolated;
        }

        return maybeFn;
    }
});
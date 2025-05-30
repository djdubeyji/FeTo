/**
 * Makes jQuery onReady handlers isolated from each other, so that an error in one handler doesn't impact the others.
 * notes:
 * - this can be moved to the cross-product jquery plugin 2.x
 * - it is not needed since jQuery 3.0 as it handles that internally
 */
define('jira/jquery/isolated-onready', ['jquery', 'jira/util/logger'], function ($, logger) {
    'use strict';

    var original = $.fn.ready;

    $.fn.ready = function (fn) {
        return original.call(this, isolateCallback(fn));
    };

    /**
     * Wraps provided function in try/catch to isolate handlers' execution.
     * Wrapping preserves params, a return value, and the context.
     *
     * @param {Function} fn
     * @returns {Function}
     */
    function isolateCallback(fn) {
        return function isolatedCallback() {
            try {
                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                return fn.apply(this, args);
            } catch (e) {
                logger.error('An error occurred in one of the jQuery onReady callbacks', e);
            }
        };
    }
});
require('jira/jquery/isolated-onready');
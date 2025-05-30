/**
 * @module jira/util/init-on-dcl
 */
define('jira/util/init-on-dcl', ['jira/util/logger'], function (logger) {
    'use strict';

    var onLoad = function onLoad(fn) {
        if (!fn || typeof fn !== 'function') {
            logger.error('Failed to run init function - fn doesn\'t exist or isn\'t a function', fn);

            return;
        }

        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            setTimeout(fn, 1);
        } else {
            // eslint-disable-next-line @atlassian/onready-checks/no-domcontentloaded-handlers
            document.addEventListener('DOMContentLoaded', fn, {
                once: true
            });
        }
    };

    return onLoad;
});
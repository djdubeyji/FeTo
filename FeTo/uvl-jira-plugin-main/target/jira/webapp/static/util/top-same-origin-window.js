/**
 * Created by arantos on 2/02/2016.
 *
 * Utility functions for identifying the top-most JIRA window within the origin boundary.
 * Some scripts were requiring the top window, which (in some cases) was causing cross-origin violation exceptions.
 * For example the jira-issue-collector was designed to run inside an iframe at websites that were different origin
 * from where JIRA is hosted. That caused cross-origin violation during the rendering of the iframe.
 * @module jira/util/topSameOriginWndow
 */
define('jira/util/top-same-origin-window', function () {
    'use strict';

    return function (parentOf) {
        var lastJiraWindow = parentOf;

        function satisfiesSameOrigin(w) {
            try {
                // Accessing location.href from a window on another origin will throw an exception.
                // eslint-disable-next-line eqeqeq
                if (w.location.href == undefined) {
                    return false;
                }
            } catch (e) {
                return false;
            }
            return true;
        }

        function isTopMostWindow(w) {
            return w === w.parent;
        }

        function isJiraWindow(w) {
            // it will match other Atlassian products (with AJS object), is that an issue?
            return Boolean(w.AJS);
        }

        while (!isTopMostWindow(parentOf) && satisfiesSameOrigin(parentOf.parent)) {
            parentOf = parentOf.parent;
            if (isJiraWindow(parentOf)) {
                lastJiraWindow = parentOf;
            }
        }
        return lastJiraWindow;
    };
});
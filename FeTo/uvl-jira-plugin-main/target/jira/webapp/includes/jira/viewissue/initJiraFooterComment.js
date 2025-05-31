define('jira/viewissue/invoke-comment-trigger', ['jquery'], function ($) {
    'use strict';

    /**
     * Observe element with "data-queued-click" attribute and trigger a callback when that attribute disappears.
     * Also attach listeners to document in order to cancel the observer and callback if any other interaction happens.
     *
     * @param element - element with "data-queued-click" attribute
     * @param callback - callback to be ran when "data-queued-click" attribute disappears
     */

    var observeClickQueuedElement = function observeClickQueuedElement(element, callback) {
        var mutationObserver = new MutationObserver(function (mutationsList, observer) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = mutationsList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var mutation = _step.value;

                    if (mutation.type === 'attributes' && !mutation.target.hasAttribute('data-queued-click')) {
                        callback();
                        observer.disconnect();
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        });

        function disconnectObserver() {
            mutationObserver.disconnect();
            ['mouseover', 'scroll', 'keydown'].forEach(function (eventType) {
                document.body.removeEventListener(eventType, disconnectObserver);
            });
        }

        ['mouseover', 'scroll', 'keydown'].forEach(function (eventType) {
            document.body.addEventListener(eventType, disconnectObserver);
        });

        mutationObserver.observe(element, { attributes: true });
    };

    /**
     * Invoke the most appropriate comment trigger on page.
     * If the header toolbar trigger is present then invoke that.
     * Otherwise invoke the first link with ".add-issue-comment" class (needed for adding comments in Issue Nav list view).
     *
     * @note Used by keyboard shortcuts on the view issue page.
     *       Specifically, the 'm' keyboard shortcut.
     *
     */
    return function invokeCommentTrigger() {
        var addIssueComment = $(".add-issue-comment");
        if (addIssueComment.length === 0) {
            return;
        }

        var toolbarTrigger = addIssueComment.filter(".toolbar-trigger").get(0);
        var elementToClick = toolbarTrigger || addIssueComment.get(0);

        if (elementToClick.hasAttribute('data-queued-click')) {
            observeClickQueuedElement(elementToClick, function () {
                return elementToClick.click();
            });
        } else {
            elementToClick.click();
        }
    };
});

(function () {
    'use strict';

    var commentForm = require('jira/viewissue/comment/comment-form');
    AJS.namespace('JIRA.Issue.CommentForm', null, commentForm);
    AJS.namespace('JIRA.Issue.getDirtyCommentWarning', null, commentForm.handleBrowseAway);
    AJS.namespace('JIRA.Issue.invokeCommentTrigger', null, require('jira/viewissue/invoke-comment-trigger'));
})();
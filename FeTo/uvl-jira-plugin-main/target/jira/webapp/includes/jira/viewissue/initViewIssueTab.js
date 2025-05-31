define('jira/viewissue/tabs/initTab', ['wrm/context-path', 'jira/featureflags/feature-manager', 'jira/util/data/meta'], function (wrmContextPath, featureManager, meta) {
    'use strict';

    var IS_SERVER_SIDE_RENDERED = !featureManager.isFeatureEnabled('com.atlassian.jira.lazyload.activity.tabs');

    function hasValidFocusedItem() {
        return window.location.hash.match(/(comment|worklog)-/);
    }

    return function initTab(event, $el) {
        // If the feature flag is turned off, the activity tab is server-side rendered. All we want to do then is to call
        // domReady method on jira/viewissue/tabs (which is done in jira/viewissue/init-view-issue-tabs). To make it happen we have to
        // set is-ready guard to true.
        if (IS_SERVER_SIDE_RENDERED) {
            $el.data('is-ready', true);
        }

        if (!IS_SERVER_SIDE_RENDERED && $el.find('#activity-panel-placeholder').length > 0 && !$el.data('is-ready')) {
            $el.data('is-ready', true); // imagine scenario where the AJAX call is not yet done and we receive another placeholder
            var url = wrmContextPath() + '/browse/' + meta.get('issue-key') + window.location.search;
            return fetch(url, {
                headers: {
                    'X-PJAX': 'true', // needed for the ViewIssue action to return only the activity panel
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }).then(function (response) {
                return response.text();
            }).then(function (activityModuleMarkup) {
                $el.find('.mod-content').html(activityModuleMarkup);
                if (hasValidFocusedItem()) {
                    var focusedItem = document.querySelector(window.location.hash);
                    focusedItem && focusedItem.scrollIntoView();
                }
                return $el;
            });
        }

        return Promise.resolve($el);
    };
});
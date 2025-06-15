require(['jira/page/atl/prefetch', 'jquery'], function executePrefetch(resourcePrefetch, $) {
    'use strict';

    $(window).on('load', resourcePrefetch.prefetchViewIssueResources.bind(resourcePrefetch));
});
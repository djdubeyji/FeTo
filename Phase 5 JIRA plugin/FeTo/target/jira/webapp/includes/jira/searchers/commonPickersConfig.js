define('jira/searchers/element/common-pickers-config', [], function () {
    'use strict';

    /**
     * Common configuration for drop-downs in Jira
     */

    return {
        DEFAULT_MAX_RESULTS: 100, // Ajax param to tell server how many results to return at most
        DEFAULT_START_AT: 0, // If endpoint supports pagination, default start index to return results
        DEFAULT_MAX_RESULTS_PER_GROUP: 100 // Param to define how many results at most can be in one group
    };
});
define('jira/searchers/element/common-pickers-utils', [], function () {
    'use strict';

    var projectPickerValueSelector = '.search-criteria li[data-id="project"] .searcherValue';

    /**
     * Utility functions for drop-downs. Used by pickers present in JQL Basic Search mode view
     */
    return {
        /**
         * Gets the selected project IDs from the project picker HTML structure.
         * Applies to Issue Search (Basic mode) context, where project picker is present.
         * @returns {string[]} A string array of selected project IDs, or undefined if there are none
         */
        getSelectedProjectsIds: function getSelectedProjectsIds() {
            var projectPickerSearcherElement = document.querySelector(projectPickerValueSelector);

            if (projectPickerSearcherElement) {
                var selectedProjectsIds = projectPickerSearcherElement.dataset.selectedProjectsIds;

                if (selectedProjectsIds) {
                    return selectedProjectsIds.split(',');
                }
            }
        },
        /**
         * Gets the selected issue type IDs from the project picker HTML structure.
         * Applies to Issue Search (Basic mode) context, where project picker is present.
         * @returns {string[]} A string array of selected issue type IDs, or undefined if there are none
         */
        getSelectedIssueTypeIds: function getSelectedIssueTypeIds() {
            var projectPickerSearcherElement = document.querySelector(projectPickerValueSelector);

            if (projectPickerSearcherElement) {
                var selectedIssueTypeIds = projectPickerSearcherElement.dataset.selectedIssueTypeIds;

                if (selectedIssueTypeIds) {
                    return selectedIssueTypeIds.split(',');
                }
            }
        }
    };
});
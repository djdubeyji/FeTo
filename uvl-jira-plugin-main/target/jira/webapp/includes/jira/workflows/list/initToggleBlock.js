require(['jquery', 'jira/libs/parse-uri', 'jira/toggleblock/toggle-block', "jira/util/strings"], function (jQuery, parseUri, ToggleBlock, strings) {
    'use strict';

    jQuery(function () {
        // eslint-disable-line @atlassian/onready-checks/no-jquery-onready
        var toggleBlocks = new ToggleBlock({
            blockSelector: ".toggle-wrap",
            triggerSelector: ".mod-header .toggle-title",
            originalTargetIgnoreSelector: "a",
            storageCollectionName: "x-i-am-not-used",
            persist: false
        });

        function clearHash(title) {
            if (window.history && window.history.replaceState) {
                window.history.replaceState(null, title, window.location.href.split('#')[0]);
            } else {
                window.location.hash = "";
            }
        }

        function checkWorkflow() {
            var anchor = parseUri(window.location).anchor;
            if (anchor && anchor.indexOf("workflowName=") === 0) {
                clearHash("Workflow Page");
                return decodeURIComponent(anchor.split("=")[1].replace(/\+/g, " "));
            }
        }

        var workflowName = checkWorkflow();
        if (workflowName) {
            var $row = jQuery("[data-workflow-name='" + strings.escapeHtml(workflowName) + "']").addClass("focused");
            toggleBlocks.expand($row.closest(toggleBlocks.options.blockSelector));
            $row.scrollIntoView();
        }
    });
});
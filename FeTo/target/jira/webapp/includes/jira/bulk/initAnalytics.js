/**
 * Reports bulk move events to analytics.
 */
(function () {
    'use strict';

    var $ = require('jquery');
    var analytics = require('jira/analytics');

    $(function () {
        // eslint-disable-line @atlassian/onready-checks/no-jquery-onready
        var groupsAll = $('.bulk-group').length;
        if (groupsAll > 0) {
            var groupsSubtaskToIssue = $('.subtask-to-issue').length;
            var groupsIssueToSubtask = $('.issue-to-subtask').length;
            var groupsSubtaskToSubtask = $('.subtask-to-subtask').length;

            analytics.send({
                name: "jira.bulk.move.page.confirmation.groups",
                data: {
                    all: groupsAll,
                    subtaskToIssue: groupsSubtaskToIssue,
                    issueToSubtask: groupsIssueToSubtask,
                    subtaskToSubtask: groupsSubtaskToSubtask
                }
            });
        }
    });
})();
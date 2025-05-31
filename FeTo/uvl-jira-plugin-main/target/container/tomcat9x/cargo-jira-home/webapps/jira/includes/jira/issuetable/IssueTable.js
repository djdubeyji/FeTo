/**
 * Provides API to perform and listen for drag-and-drops in the IssueTable.
 * Mostly useful for code responsible for subtasks representation.
 */
define("jira/issuetable", ["jira/skate", 'wrm/require', 'require'], function (skate, wrmRequire, require) {
    'use strict';

    var issueTableDnd = void 0;

    var draggableTableApi = new Promise(function (resolve) {
        skate("issuetable-web-component", {
            isSubtasksTable: false,
            attached: function attached(elem) {
                this.isSubtasksTable = elem.dataset.content === "subtasks";

                if (!this.isSubtasksTable) {
                    return;
                }

                return wrmRequire('wr!jira.webresources:issue-table-dnd').then(function () {
                    issueTableDnd = require('jira/issuetable/dnd');
                    elem.table = issueTableDnd.enhancedTable(elem);
                    issueTableDnd.impl.attach(elem.table);

                    return resolve(issueTableDnd.api);
                });
            },

            detached: function detached(elem) {
                if (!elem.table) {
                    return;
                }

                issueTableDnd.impl.detach(elem.table);
            }
        });
    });

    return draggableTableApi;
});
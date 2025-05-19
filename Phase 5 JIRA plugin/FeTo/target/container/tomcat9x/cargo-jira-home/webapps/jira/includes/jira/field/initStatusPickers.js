define('jira/field/init-status-pickers', ['jira/util/events/reasons', 'jira/util/events/types', 'jira/util/events', 'jira/field/status-category-single-select'], function (Reasons, Types, Events, StatusCategorySingleSelect) {
    'use strict';

    function createCategoryPicker(context) {
        context.find("select#statusCategory").each(function (i, el) {
            new StatusCategorySingleSelect({
                element: el,
                revertOnInvalid: true
            });
        });
    }

    Events.bind(Types.NEW_CONTENT_ADDED, function (e, context, reason) {
        //eslint-disable-line @atlassian/jira-event-checks/no-newcontentadded-handlers
        if (reason !== Reasons.panelRefreshed) {
            createCategoryPicker(context);
        }
    });
});
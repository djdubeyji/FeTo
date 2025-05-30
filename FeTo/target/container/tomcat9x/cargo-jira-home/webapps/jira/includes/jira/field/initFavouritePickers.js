define('jira/field/init-favourite-pickers', ['jira/field/favourite-picker', 'jira/util/events/reasons', 'jira/util/events/types', 'jira/util/events'], function (FavouritePicker, Reasons, Types, Events) {
    'use strict';

    Events.bind(Types.NEW_CONTENT_ADDED, function (e, $ctx, reason) {
        //eslint-disable-line @atlassian/jira-event-checks/no-newcontentadded-handlers
        if (reason === Reasons.pageLoad) {
            FavouritePicker.init($ctx);
        }
    });
});
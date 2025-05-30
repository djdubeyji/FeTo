/**
 * Binds to many events to publish a single "newContentAdded" event. We use this to bind javascript to dynamically
 * inserted content
 */
(function () {
    'use strict';

    var Events = require('jira/util/events');
    var Types = require('jira/util/events/types');
    var Reasons = require('jira/util/events/reasons');
    var jQuery = require('jquery');

    // On dom ready
    jQuery(function () {
        // eslint-disable-line @atlassian/onready-checks/no-jquery-onready
        var ctx = jQuery(document);
        Events.trigger(Types.NEW_CONTENT_ADDED, [ctx, Reasons.pageLoad]);
        Events.trigger(Types.NEW_PAGE_ADDED, [ctx]);
    });

    // When dialog content refreshed
    Events.bind("dialogContentReady", function (e, dialog) {
        var ctx = dialog.get$popupContent();
        Events.trigger(Types.NEW_CONTENT_ADDED, [ctx, Reasons.dialogReady]);
        Events.trigger(Types.NEW_PAGE_ADDED, [ctx]);
    });

    // When arbitary fragment has been refreshed
    Events.bind("contentRefreshed", function (e, context) {
        // This event does not include a reason because it is too generic.
        var ctx = jQuery(context);
        Events.trigger(Types.NEW_CONTENT_ADDED, [ctx]);
    });
})();
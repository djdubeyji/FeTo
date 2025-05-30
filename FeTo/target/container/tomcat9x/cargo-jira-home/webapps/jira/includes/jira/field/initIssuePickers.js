define('jira/field/init-issue-pickers', ['jira/field/issue-picker', 'jira/util/events', 'jira/util/events/types', 'jira/util/events/reasons', 'jquery', 'jira/util/formatter'], function (IssuePicker, Events, Types, Reasons, jQuery, formatter) {
    'use strict';

    function initIssuePicker(el) {
        jQuery(el || document.body).find('.aui-field-issuepicker').each(function () {
            new IssuePicker({
                element: jQuery(this),
                userEnteredOptionsMsg: formatter.I18n.getText('linkissue.enter.issue.key'),
                uppercaseUserEnteredOnSelect: true
            });
        });
    }

    Events.bind(Types.NEW_CONTENT_ADDED, function (e, context, reason) {
        //eslint-disable-line @atlassian/jira-event-checks/no-newcontentadded-handlers
        if (reason !== Reasons.panelRefreshed) {
            initIssuePicker(context);
        }
    });
});
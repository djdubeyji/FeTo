/**
 * Initializes terminology onboarding inline dialogs in issue view.
 * This isn't lazy loaded because we need the Events.bind(Types.NEW_CONTENT_ADDED) listeners to hit when issue is rendered
 */
require(['jira/terminology-feature-service', 'jira/terminology-onboarding-state', 'jira/util/events', 'jira/util/events/types', 'wrm/require'], function (terminologyFeatureService, terminologyOnboardingState, Events, Types, wrmRequire) {
    'use strict';

    var FIELDS = {
        SPRINT: 'sprint',
        EPIC: 'epic'
    };
    var FIELD_SELECTORS = {
        sprint: '#customfieldmodule .type-gh-sprint',
        epicLink: '#customfieldmodule .type-gh-epic-link',
        epicName: '#customfieldmodule .type-gh-epic-label'
    };

    var sprintDialogDismissed = terminologyOnboardingState.get(FIELDS.SPRINT);
    var epicDialogDismissed = terminologyOnboardingState.get(FIELDS.EPIC);
    // Do nothing if both dialogs were dismissed
    if (sprintDialogDismissed && epicDialogDismissed) {
        return;
    }

    // Do nothing if terminology is not active on the instance.
    if (!terminologyFeatureService.isTerminologyActiveForUser()) {
        return;
    }

    /**
     * IssueNav plugin (issueviewer/js/IssueViewer.js ) triggers following event when issue panels are rendered
     * Events.trigger(Types.NEW_CONTENT_ADDED, [renderedPanel, Reasons.panelRefreshed]);
     */
    Events.bind(Types.NEW_CONTENT_ADDED, function (e, $renderedPanel) {
        //eslint-disable-line @atlassian/jira-event-checks/no-newcontentadded-handlers
        var panelId = $renderedPanel.attr('id');
        // This event is triggered for rendering many panels in issue view
        if (panelId !== 'details-module') {
            return;
        }
        /*
         * In issue search detail view, user can dismiss the dialogs and view another issue without refreshing the page.
         * So we need to re-fetch the localStorage state
         */
        var sprintDialogDismissed = terminologyOnboardingState.get(FIELDS.SPRINT);
        var epicDialogDismissed = terminologyOnboardingState.get(FIELDS.EPIC);

        wrmRequire(['wr!jira.webresources:terminology-onboarding-inline-dialogs'], function () {
            require(['jira/terminology-onboarding-dialog'], function (terminologyOnboardingDialog) {
                var sprintEntry = terminologyFeatureService.getTerminologyEntryForTerm(FIELDS.SPRINT);
                var epicEntry = terminologyFeatureService.getTerminologyEntryForTerm(FIELDS.EPIC);
                if (sprintEntry && !sprintDialogDismissed) {
                    var $sprintDialogTrigger = $renderedPanel.find(FIELD_SELECTORS[FIELDS.SPRINT]).prev('strong.name');
                    terminologyOnboardingDialog.addInlineDialogToField($renderedPanel, $sprintDialogTrigger, sprintEntry, FIELDS.SPRINT);
                }
                if (epicEntry && !epicDialogDismissed) {
                    var $epicLinkTrigger = $renderedPanel.find(FIELD_SELECTORS.epicLink).prev('strong.name');
                    terminologyOnboardingDialog.addInlineDialogToField($renderedPanel, $epicLinkTrigger, epicEntry, FIELDS.EPIC);

                    var $epicNameTrigger = $renderedPanel.find(FIELD_SELECTORS.epicName).prev('strong.name');
                    terminologyOnboardingDialog.addInlineDialogToField($renderedPanel, $epicNameTrigger, epicEntry, FIELDS.EPIC);
                }
            });
        });
    });
});
define('jira/viewissue/init-view-issue-tabs', ['jquery', 'wrm/require', 'jira/util/events', 'jira/util/events/types', 'jira/viewissue/tabs', 'jira/viewissue/tabs/initTab'], function (jQuery, wrmRequire, Events, Types, Tabs, initTab) {
    'use strict';

    jQuery(function () {
        // eslint-disable-line @atlassian/onready-checks/no-jquery-onready
        // For some mysterious reason NEW_CONTENT_ADDED event is sometimes not triggered properly
        // in standalone issue view (coming from GIN list view to issue view).
        // To circumvent this issue we call init code here as well.
        var $activityModule = jQuery('#activitymodule');
        if ($activityModule.length === 1) {
            initializeTabs(null, $activityModule);
        }

        // Remembering focused activity after we refresh panel
        if (Types.PANEL_REFRESHED) {
            // kickass
            Events.bind(Types.PANEL_REFRESHED, function (e, panel, $new, $existing) {
                if (panel === 'activitymodule') {
                    var $focusedTab = $existing.find('#issue_actions_container > .issue-data-block.focused');
                    // assume only one focused tab
                    if ($focusedTab.length === 1) {
                        $new.find('#' + $focusedTab.attr('id')).addClass('focused');
                    }
                }
            });
        }
    });

    function setPerformanceMark() {
        performance.mark('activityTabFullyLoaded');
    }

    Events.bind(Types.NEW_CONTENT_ADDED, function (event, $el) {
        //eslint-disable-line @atlassian/jira-event-checks/no-newcontentadded-handlers
        if ($el.is('#activitymodule') && !$el.data('is-ready')) {
            initializeTabs(event, $el);
        }
    });

    function initializeTabs(event, $el) {
        initTab(event, $el).then(function ($tabs) {
            setPerformanceMark('activityTabFullyLoaded');
            Tabs.domReady($tabs);
        }).catch(function () {
            wrmRequire(['wr!jira.webresources:jira-formatter', 'wr!jira.webresources:messages', 'wr!jira.webresources:jira-analytics-amd', 'wr!jira.webresources:jira-issuenavigator'], function () {
                var formatter = require('jira/util/formatter');
                var flag = require('jira/flag');
                var analytics = require('jira/analytics');
                var IssueAPI = require('jira/issue');

                analytics.send({
                    name: 'jira.viewissue.tab.error',
                    properties: {
                        entityId: IssueAPI.getIssueId()
                    }
                });
                var refreshPageLink = document.createElement('a');
                refreshPageLink.setAttribute('href', window.location.href);
                refreshPageLink.textContent = formatter.I18n.getText("viewissue.tabs.loading.error.refresh");

                flag.showWarningMsg('', formatter.I18n.getText("viewissue.tabs.loading.error", refreshPageLink.outerHTML) + '<br />' + formatter.I18n.getText("viewissue.tabs.loading.error.contact"));
            }).catch(function () {
                console.error('Failed to display tab error message due to error when loading WRM dependencies.');
            });
        });
    }
});
/**
 * @module jira/common/header
 */
define('jira/common/header', ['jira/util/formatter', 'jira/message', 'jira/issue', 'jira/util/events', 'exports', 'wrm/context-path'], function (formatter, Messages, Issue, Events, exports, contextPath) {
    'use strict';

    var messageBuffer = {};

    var resolveHeaderInit;
    var headerInitPromise = new Promise(function (resolve) {
        resolveHeaderInit = resolve;
    });

    var getProjectAdminLink = function getProjectAdminLink(issueKey, section) {
        var projectKey = issueKey.substr(0, issueKey.indexOf("-"));
        return formatter.format('<a href="{0}" target="_blank">', contextPath() + "/plugins/servlet/project-config/" + projectKey + "/" + section);
    };

    var showMessage = function showMessage(html) {
        if (html) {
            Messages.showSuccessMsg(html, {
                closeable: true
            });
        }
        //clear out the buffer.
        messageBuffer = {};
    };

    var getEditMessage = function getEditMessage(versionMsg, compnentMsg) {
        var html = "";
        if (messageBuffer.versionCreated) {
            html = "<p>" + versionMsg + "</p>";
        }
        if (messageBuffer.componentCreated) {
            html += "<p>" + compnentMsg + "</p>";
        }
        return html;
    };

    // A function for retrieving the KickAss API.
    // TODO: Replace this with require() call once AMD module exists for KickAss' API.
    var issueApp = function getKickAssAPIObject() {
        if (JIRA && JIRA.Issues && JIRA.Issues.Application) {
            return JIRA.Issues.Application;
        }
        return false; // KickAss' API doesn't exist
    };

    // Keeping a reference for event handlers. I'm doing it this way because I wanted to affect as few lines in the commit diff as possible.
    var sessionCompleteCb;

    var saveSuccessCb;
    var versionCb;
    var componentCb;

    /**
     * Initialised the header module.  Binds to various events that will result in
     * global messages being shown.
     */
    exports.initialize = function () {
        Events.bind("QuickCreateIssue.sessionComplete", sessionCompleteCb = function sessionCompleteCb(e, issues) {
            // show the success message in a async way so that this doesn't influence a removal of a create issue dialog
            setTimeout(function () {
                var issue = [].concat(issues).pop(); //get the last issue created

                var html = Issue.issueCreatedMessage(issue);
                html += getEditMessage(formatter.I18n.getText("jira.version.created.quick.create", getProjectAdminLink(issue.issueKey, "versions"), "</a>"), formatter.I18n.getText("jira.component.created.quick.create", getProjectAdminLink(issue.issueKey, "components"), "</a>"));
                showMessage(html);
            }, 100);
        });

        if (issueApp()) {
            issueApp().on("issueEditor:saveSuccess", saveSuccessCb = function saveSuccessCb(saveDetails) {
                // Only the latest version of the issueEditor includes the issueKey in the event.  For older versions we fall back to JIRA.Issue.getIssueKey() which could be buggy if the user
                // has already moved on to another issue when the saveSuccess comes back.  Eventually we can just rely on the key from the event once we're on the latest version of KA.
                var issueKey = saveDetails && saveDetails.issueKey ? saveDetails.issueKey : Issue.getIssueKey();
                var msg = getEditMessage(formatter.I18n.getText("jira.version.created", getProjectAdminLink(issueKey, "versions"), "</a>"), formatter.I18n.getText("jira.component.created", getProjectAdminLink(issueKey, "components"), "</a>"));
                showMessage(msg);
            });
        }

        Events.bind("Issue.Version.new.selected", versionCb = function versionCb() {
            messageBuffer.versionCreated = true;
        });

        Events.bind("Issue.Component.new.selected", componentCb = function componentCb() {
            messageBuffer.componentCreated = true;
        });

        typeof resolveHeaderInit === 'function' && resolveHeaderInit();
    };

    /**
     * A promise that resolves once initialisation is complete.
     *
     * @type {Promise<undefined>}
     */
    exports.headerInitialising = headerInitPromise;

    /**
     * Unbinds any events the header module listens for.
     */
    exports.unbind = function () {
        Events.unbind("QuickCreateIssue.sessionComplete", sessionCompleteCb);
        Events.unbind("Issue.Version.new.selected", versionCb);
        Events.unbind("Issue.Component.new.selected", componentCb);
        if (issueApp()) {
            issueApp().unbind("issueEditor:saveSuccess", saveSuccessCb);
        }
    };
});
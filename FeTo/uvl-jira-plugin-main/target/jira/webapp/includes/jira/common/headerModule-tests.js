AJS.test.require(["jira.webresources:jira-global"], function () {
    'use strict';

    var Backbone = require("jira/backbone-1.3.3");
    var _ = require("underscore");
    var $ = require("jquery");
    var oldIssues;

    var MESSAGE_DELAY_MS = 200;

    module("Header Message Tests", {
        setup: function setup() {
            oldIssues = JIRA.Issues;
            //mock out the issues application
            JIRA.Issues = {};
            JIRA.Issues.Application = {};
            JIRA.Issues.Application = _.extend({}, Backbone.Events);

            this.header = require("jira/common/header");

            //unbind the domready handler first.
            this.header.unbind();
            this.header.initialize();
            this.removeFlags();
            this.assertNoFlags();
        },
        teardown: function teardown() {
            this.removeFlags();
            this.header.unbind();
            JIRA.Issues = oldIssues;
        },
        removeFlags: function removeFlags() {
            $(".aui-flag").remove();
        },
        assertNoFlags: function assertNoFlags() {
            var customReason = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "No message shown initially";

            equal($(".aui-flag").length, 0, customReason);
        }
    });

    var assertMessageShown = function assertMessageShown(containsMessages, messagesShouldNotContain) {
        var $globalMsg = $(".aui-flag");
        equal($globalMsg.length, 1, "Global message should be shown");
        var messageBody = $globalMsg.text();
        for (var i = 0; i < containsMessages.length; i++) {
            ok(messageBody.indexOf(containsMessages[i]) >= 0, "Global message contains text '" + containsMessages[i] + "'.");
        }
        for (var j = 0; j < messagesShouldNotContain.length; j++) {
            ok(messageBody.indexOf(messagesShouldNotContain[j]) < 0, "Global message does not contain text '" + messagesShouldNotContain[j] + "'.");
        }
    };

    test("Correct message shows up on component created via quickcreate", function (assert) {
        var done = assert.async();

        JIRA.trigger("Issue.Component.new.selected");
        JIRA.trigger("QuickCreateIssue.sessionComplete", [{ issueKey: "HSP-1", summary: "A sample issue" }]);

        setTimeout(function () {
            assertMessageShown(["createissue.issuecreated", "jira.component.created.quick.create"], ["jira.version.created.quick.create"]);

            done();
        }, MESSAGE_DELAY_MS);
    });

    test("Correct message shows up on version created via quickcreate", function (assert) {
        var done = assert.async();

        JIRA.trigger("Issue.Version.new.selected");
        JIRA.trigger("QuickCreateIssue.sessionComplete", [{ issueKey: "HSP-1", summary: "A sample issue" }]);

        setTimeout(function () {
            assertMessageShown(["createissue.issuecreated", "jira.version.created.quick.create"], ["jira.component.created.quick.create"]);

            done();
        }, MESSAGE_DELAY_MS);
    });

    test("Correct message shows up on version created with multiple issues created via quickcreate", function (assert) {
        var done = assert.async();

        JIRA.trigger("Issue.Version.new.selected");
        JIRA.trigger("QuickCreateIssue.sessionComplete", [{ issueKey: "HSP-1", summary: "A sample issue" }, { issueKey: "HSP-2", summary: "A second sample issue" }]);

        setTimeout(function () {
            assertMessageShown(["createissue.issuecreated", "jira.version.created.quick.create"], ["jira.component.created.quick.create"]);

            done();
        }, MESSAGE_DELAY_MS);
    });

    test("Correct message shows up on version and component created via quickcreate", function (assert) {
        var done = assert.async();

        JIRA.trigger("Issue.Version.new.selected");
        JIRA.trigger("Issue.Component.new.selected");
        JIRA.trigger("QuickCreateIssue.sessionComplete", [{ issueKey: "HSP-1", summary: "A sample issue" }]);

        setTimeout(function () {
            assertMessageShown(["createissue.issuecreated", "jira.version.created.quick.create", "jira.component.created.quick.create"], []);

            done();
        }, MESSAGE_DELAY_MS);
    });

    test("Correct message shows up on version created via inline-edit", function () {
        JIRA.Issue.getIssueKey = sinon.stub().returns("HSP-1");

        JIRA.trigger("Issue.Version.new.selected");
        JIRA.Issues.Application.trigger("issueEditor:saveSuccess");

        assertMessageShown(["jira.version.created"], ["createissue.issuecreated", "jira.component.created"]);
    });

    test("Correct message shows up on component created via inline-edit", function () {
        JIRA.Issue.getIssueKey = sinon.stub().returns("HSP-1");

        JIRA.trigger("Issue.Component.new.selected");
        JIRA.Issues.Application.trigger("issueEditor:saveSuccess");

        assertMessageShown(["jira.component.created"], ["createissue.issuecreated", "jira.version.created"]);
    });

    test("Correct message shows up on version and component created via inline-edit", function () {
        JIRA.Issue.getIssueKey = sinon.stub().returns("HSP-1");

        JIRA.trigger("Issue.Component.new.selected");
        JIRA.trigger("Issue.Version.new.selected");
        JIRA.Issues.Application.trigger("issueEditor:saveSuccess");

        assertMessageShown(["jira.component.created", "jira.version.created"], ["createissue.issuecreated"]);
    });

    test("unbind should only remove header's handlers for QuickEdit", function () {
        var spy1 = sinon.spy();
        var spy2 = sinon.spy();
        var spy3 = sinon.spy();
        JIRA.bind("QuickEdit.sessionComplete", spy1);
        JIRA.bind("Issue.Version.new.selected", spy2);
        JIRA.bind("Issue.Component.new.selected", spy3);
        this.header.unbind();

        JIRA.trigger("Issue.Component.new.selected");
        JIRA.trigger("Issue.Version.new.selected");

        JIRA.trigger("QuickEdit.sessionComplete");
        this.assertNoFlags("Global message should NOT be shown");
        equal(spy1.callCount, 1, "should be called even though header's handlers were not");
        equal(spy2.callCount, 1, "should be called even though header's handlers were not");
        equal(spy3.callCount, 1, "should be called even though header's handlers were not");
    });
});
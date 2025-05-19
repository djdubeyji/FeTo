AJS.test.require(["jira.webresources:viewissue-tabs"], function () {
    'use strict';

    var $ = require("jquery");

    var Events = require("jira/util/events");

    module("initViewIssueTabs", {
        setup: function setup() {
            this.sandbox = sinon.sandbox.create();
            this.context = AJS.test.mockableModuleContext();

            this.initTabSpy = sinon.stub().returns(Promise.resolve());
            this.tabsSpy = sinon.stub();
            this.context.mock("jira/viewissue/tabs/initTab", this.initTabSpy);
            this.context.mock('jira/viewissue/tabs', { domReady: this.tabsSpy });
            this.initViewIssueTabs = this.context.require("jira/viewissue/init-view-issue-tabs");
        },
        teardown: function teardown() {
            this.sandbox.restore();
        }
    });

    test('initTab is called for activitymodule without is-ready data attribute set', function () {
        Events.trigger('newContentAdded', [$('<div id="activitymodule"></div>')]);

        sinon.assert.calledOnce(this.initTabSpy);
    });

    test('initTab is not called for activitymodule with is-ready data attribute set', function () {
        Events.trigger('newContentAdded', [$('<div id="activitymodule" data-is-ready="true"></div>')]);

        sinon.assert.notCalled(this.initTabSpy);
    });

    test('initTab is called only once', function () {
        Events.trigger('newContentAdded', [$('<div id="activitymodule"></div>')]);
        Events.trigger('newContentAdded', [$('<div id="activitymodule" data-is-ready="true"></div>')]);

        sinon.assert.calledOnce(this.initTabSpy);
    });

    test('initTab is not called for elements different than activitymodule', function () {
        Events.trigger('newContentAdded', [$('<div id="activity"></div>')]);

        sinon.assert.notCalled(this.initTabSpy);
    });
});
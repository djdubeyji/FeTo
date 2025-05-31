AJS.test.require(["jira.webresources:viewissue-tabs"], function () {
    'use strict';

    var $ = require("jquery");

    module("initViewIssueTab with feature flag turned off", {
        setup: function setup() {
            this.sandbox = sinon.sandbox.create();
            this.context = AJS.test.mockableModuleContext();

            this.context.mock("jira/featureflags/feature-manager", {
                isFeatureEnabled: function isFeatureEnabled() {
                    return false;
                }
            });

            this.fetchSpy = sinon.stub(window, 'fetch').returns(Promise.resolve({ text: function text() {
                    return '<div>TEST</div>';
                } }));

            this.initViewIssueTab = this.context.require("jira/viewissue/tabs/initTab");
        },
        teardown: function teardown() {
            this.sandbox.restore();
            window.fetch.restore();
            this.isFeatureEnabled = true;
        }
    });

    test('should set is-ready attribute if feature flag is turned off', function (assert) {
        assert.expect(1);
        var done = assert.async();
        var $el = $('<div id="activitymodule"><div id="activity-panel-placeholder"></div></div>');

        this.initViewIssueTab({}, $el).then(function () {
            equal($el.data('is-ready'), true);
            done();
        });
    });

    test('should not fetch data if feature flag is turned off', function (assert) {
        var _this = this;

        assert.expect(1);
        var done = assert.async();
        var $el = $('<div id="activitymodule"><div id="activity-panel-placeholder"></div></div>');

        this.initViewIssueTab({}, $el).then(function () {
            sinon.assert.notCalled(_this.fetchSpy);
            done();
        });
    });

    module("initViewIssueTab with feature flag turned on", {
        setup: function setup() {
            this.sandbox = sinon.sandbox.create();
            this.context = AJS.test.mockableModuleContext();

            this.context.mock("jira/featureflags/feature-manager", {
                isFeatureEnabled: function isFeatureEnabled() {
                    return true;
                }
            });

            this.fetchSpy = sinon.stub(window, 'fetch').returns(Promise.resolve({ text: function text() {
                    return '<div>TEST</div>';
                } }));

            this.initViewIssueTab = this.context.require("jira/viewissue/tabs/initTab");
        },
        teardown: function teardown() {
            this.sandbox.restore();
            window.fetch.restore();
        }
    });

    test('should not fetch data if placeholder element is not present', function (assert) {
        var _this2 = this;

        assert.expect(1);
        var done = assert.async();
        var $el = $('<div id="activitymodule"></div>');

        this.initViewIssueTab({}, $el).then(function () {
            sinon.assert.notCalled(_this2.fetchSpy);
            done();
        });
    });

    test('should fetch data if placeholder element is present and is-ready data attribute is not set', function (assert) {
        var _this3 = this;

        assert.expect(1);
        var done = assert.async();
        var $el = $('<div id="activitymodule"><div id="activity-panel-placeholder"></div><div class="mod-content"></div></div>');

        this.initViewIssueTab({}, $el).then(function () {
            sinon.assert.calledOnce(_this3.fetchSpy);
            done();
        });
    });

    test('should not fetch data if placeholder element is present and is-ready data attribute is set', function (assert) {
        var _this4 = this;

        assert.expect(1);
        var done = assert.async();
        var $el = $('<div id="activitymodule" data-is-ready="true"><div id="activity-panel-placeholder"></div><div class="mod-content"></div></div>');

        this.initViewIssueTab({}, $el).then(function () {
            sinon.assert.notCalled(_this4.fetchSpy);
            done();
        });
    });
});
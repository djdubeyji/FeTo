AJS.test.require(["jira.webresources:jira-global"], function () {
    'use strict';

    var $ = require("jquery");

    module("shouldInitTooltips", {
        setup: function setup() {
            var _this = this;

            this.$fixture = $("#qunit-fixture");
            this.$fixture.empty();
            this.sandbox = sinon.sandbox.create();
            this.tooltipStub = this.sandbox.stub($.fn, 'tooltip');

            this.assertElementHasTooltip = function (name, $el, hasTooltip, assert) {
                if (hasTooltip) {
                    assert.expect(3);
                } else {
                    assert.expect(1);
                }
                _this.tooltipStub.reset();
                var done = assert.async();
                _this.$fixture.append($el);
                //waiting till skate initializes components
                setTimeout(function tooltipAttached() {
                    if (hasTooltip) {
                        sinon.assert.calledOnce(this.tooltipStub, name + " should have tooltip initialized");
                        this.tooltipStub.reset();
                        //this should trigger skate detached handler
                        this.$fixture.empty();
                        setTimeout(function tooltipDetached() {
                            sinon.assert.calledOnce(this.tooltipStub);
                            sinon.assert.calledWithExactly(this.tooltipStub, 'destroy');
                            done();
                        }.bind(this), 10);
                    } else {
                        sinon.assert.notCalled(this.tooltipStub, name + " should not have tooltip initialized");
                        done();
                    }
                }.bind(_this), 10);
            };
        },

        teardown: function teardown() {
            this.sandbox.restore();
            this.$fixture.empty();
        }
    });

    test("Should not create tooltip for link with title", function (assert) {
        var aWithTitle = $("<a title='title1'></a>");

        this.assertElementHasTooltip("Link with title", aWithTitle, false, assert);
    });

    test("Should not create tooltip for link without title", function (assert) {
        var aWithoutTitle = $("<a></a>");

        this.assertElementHasTooltip("Link without title", aWithoutTitle, false, assert);
    });

    test("Should not create tooltip for span with title", function (assert) {
        var spanWithTitle = $("<span title='title1'></span>");

        this.assertElementHasTooltip("Span with title", spanWithTitle, false, assert);
    });

    test("Should not create tooltip for span without title", function (assert) {
        var spanWithoutTitle = $("<span></span>");

        this.assertElementHasTooltip("Span without title", spanWithoutTitle, false, assert);
    });

    test("Should create tooltip for help link with title", function (assert) {
        var aHelpLinkWithTitle = $("<a class='help-lnk' title='title1'></a>");

        this.assertElementHasTooltip("Help link with title", aHelpLinkWithTitle, true, assert);
    });

    test("Should not crate tooltip for help link without title", function (assert) {
        var aHelpLinkWithoutTitle = $("<a class='help-lnk'></a>");

        this.assertElementHasTooltip("Help link without title", aHelpLinkWithoutTitle, false, assert);
    });

    test("Should create tooltip for group picker trigger with title", function (assert) {
        var groupPickerTriggerWithTitle = $("<span class='grouppicker-trigger' title='title1'></span>");

        this.assertElementHasTooltip("Group picker trigger with title", groupPickerTriggerWithTitle, true, assert);
    });

    test("Should not create tooltip for group picker trigger without title", function (assert) {
        var groupPickerTriggerWithoutTitle = $("<span class='grouppicker-trigger'></span>");

        this.assertElementHasTooltip("Group picker trigger without title", groupPickerTriggerWithoutTitle, false, assert);
    });

    test("Should create tooltip for popup trigger with title", function (assert) {
        var popupTriggerWithTitle = $("<span class='popup-trigger' title='title1'></span>");

        this.assertElementHasTooltip("Popup trigger with title", popupTriggerWithTitle, true, assert);
    });

    test("Should not create tooltip for popup trigger without title", function (assert) {
        var popupTriggerWithoutTitle = $("<span class='popup-trigger'></span>");

        this.assertElementHasTooltip("Popup trigger without title", popupTriggerWithoutTitle, false, assert);
    });

    module("initHelpLinks", {
        setup: function setup() {
            this.$fixture = $("#qunit-fixture");
            this.$fixture.empty();
            this.sandbox = sinon.sandbox.create();
            this.windowOpenStub = this.sandbox.stub(window, 'open');
        },

        teardown: function teardown() {
            this.sandbox.restore();
            this.$fixture.empty();
        }
    });

    test("Given local helplink when clicked should open new window", function () {
        var localLink = $("<a href='http://www.atlassian.com' data-helplink='local'>local link</a>");
        this.$fixture.append(localLink);

        localLink.click();

        sinon.assert.calledOnce(this.windowOpenStub);
        sinon.assert.calledWithExactly(this.windowOpenStub, 'http://www.atlassian.com', 'jiraLocalHelp');
    });

    test("Given non local helplink when clicked should not open new window", function () {
        var nonLocalLink = $("<a href='http://www.atlassian.com'  data-helplink='remote'>non local link</a>");
        this.$fixture.append(nonLocalLink);

        nonLocalLink.click();

        sinon.assert.notCalled(this.windowOpenStub);
    });
});
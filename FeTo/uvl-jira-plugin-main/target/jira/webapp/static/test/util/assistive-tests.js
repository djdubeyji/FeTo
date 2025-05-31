AJS.test.require("jira.webresources:util-lite", function () {
    'use strict';

    var Assistive;
    var assert = sinon.assert;

    function stubDiv() {
        var innerTextStub = sinon.stub();
        var textContentStub = sinon.stub();
        var divStub = {
            innerText: "",
            textContent: "",
            setAttribute: sinon.stub(),
            innerTextStub: innerTextStub,
            textContentStub: textContentStub
        };
        Object.defineProperty(divStub, "innerText", { set: innerTextStub });
        Object.defineProperty(divStub, "textContent", { set: textContentStub });
        return divStub;
    }

    module("Assistive", {
        setup: function setup() {
            this.context = AJS.test.mockableModuleContext();
            this.sandbox = sinon.sandbox.create();
            this.sandbox.useFakeTimers();

            this.divStub = stubDiv();
            this.sandbox.stub(document, "createElement").returns(this.divStub);
            this.sandbox.stub(document.body, "appendChild");

            Assistive = this.context.require('jira/util/assistive');
        },
        teardown: function teardown() {
            this.sandbox.restore();
        }
    });

    test("#wait should execute a callback with timeout needed for screen reader to react", function () {
        var spy = sinon.spy();
        Assistive.wait(spy);

        assert.notCalled(spy);

        this.sandbox.clock.tick(50);

        assert.calledOnce(spy);
    });

    test("#readText should create element and set it's text on first call", function () {
        Assistive.readText("test");

        assert.calledOnce(document.createElement);
        equal(this.divStub.textContentStub.lastCall.args[0], " ", "Element's content is empty.");

        this.sandbox.clock.tick(50);

        equal(this.divStub.textContentStub.lastCall.args[0], "test", "Element's content is set to the parameter value.");
    });

    test("#readText should use existing element and set it's text on 2nd+ call", function () {
        Assistive.readText("test");
        this.sandbox.clock.tick(50);

        assert.calledOnce(document.createElement);

        Assistive.readText("test2");

        assert.calledOnce(document.createElement);

        this.sandbox.clock.tick(50);

        equal(this.divStub.textContentStub.lastCall.args[0], "test2", "Element's content is set to the parameter value.");
    });

    test("#readText set element's text using innerText in IE", function () {
        this.context.mock('jira/util/navigator', { isIE: function isIE() {
                return true;
            } });
        var Assistive = this.context.require('jira/util/assistive');

        Assistive.readText("test");
        this.sandbox.clock.tick(50);

        assert.calledTwice(this.divStub.innerTextStub);
        assert.notCalled(this.divStub.textContentStub);
    });

    test("#readText set element's text using textContent in other browsers", function () {
        Assistive.readText("test");
        this.sandbox.clock.tick(50);

        assert.notCalled(this.divStub.innerTextStub);
        assert.calledTwice(this.divStub.textContentStub);
    });

    test("#createOrUpdateLabel should create element with consecutive id and set it's text when called without id", function () {
        Assistive.createOrUpdateLabel("test");

        assert.calledOnce(document.createElement);
        equal(this.divStub.textContentStub.lastCall.args[0], "test", "Element's content is empty.");
        assert.calledWith(this.divStub.setAttribute, "id", "label-0");

        Assistive.createOrUpdateLabel("test2");

        assert.calledTwice(document.createElement);
        equal(this.divStub.textContentStub.lastCall.args[0], "test2", "Element's content is empty.");
        assert.calledWith(this.divStub.setAttribute, "id", "label-1");
    });

    test("#createOrUpdateLabel should create element with specific and set it's text on first call when called with id", function () {
        Assistive.createOrUpdateLabel("test", "custom-id");

        assert.calledOnce(document.createElement);
        equal(this.divStub.textContentStub.lastCall.args[0], "test", "Element's content is empty.");
        assert.calledWith(this.divStub.setAttribute, "id", "custom-id");
    });

    test("#createOrUpdateLabel should use existing element and set it's text on 2nd+ call when called with id", function () {
        Assistive.createOrUpdateLabel("test", "custom-id");

        assert.calledOnce(document.createElement);
        equal(this.divStub.textContentStub.lastCall.args[0], "test", "Element's content is empty.");
        assert.calledWith(this.divStub.setAttribute, "id", "custom-id");

        this.sandbox.stub(document, "getElementById").withArgs("custom-id").returns(this.divStub);
        Assistive.createOrUpdateLabel("test2", "custom-id");

        assert.calledOnce(document.createElement);
        equal(this.divStub.textContentStub.lastCall.args[0], "test2", "Element's content is empty.");
    });

    test("#createOrUpdateLabel should set element's text using innerText in IE", function () {
        this.context.mock('jira/util/navigator', { isIE: function isIE() {
                return true;
            } });
        var Assistive = this.context.require('jira/util/assistive');

        Assistive.createOrUpdateLabel("test");
        this.sandbox.clock.tick(50);

        assert.calledOnce(this.divStub.innerTextStub);
        assert.notCalled(this.divStub.textContentStub);
    });

    test("#createOrUpdateLabel should set element's text using textContent in other browsers", function () {
        Assistive.createOrUpdateLabel("test");
        this.sandbox.clock.tick(50);

        assert.notCalled(this.divStub.innerTextStub);
        assert.calledOnce(this.divStub.textContentStub);
    });

    test("#handleSpaceEnter should call the callback on Space or Enter, but ignore other keypresses", function () {
        var callback = sinon.spy();

        Assistive.handleSpaceEnter(new KeyboardEvent('keydown', { key: ' ' }), callback);
        equal(callback.callCount, 1, "callback called for Spacebar key");

        Assistive.handleSpaceEnter(new KeyboardEvent('keydown', { key: 'Enter' }), callback);
        equal(callback.callCount, 2, "callback called for Enter key");

        Assistive.handleSpaceEnter(new KeyboardEvent('keydown', { key: 'Tab' }), callback);
        equal(callback.callCount, 2, "callback NOT called for Tab key");
    });

    test("#handleSpaceEnter should do event.target.click() when callback is not provided", function () {
        var event = new KeyboardEvent('keydown', { key: ' ' });
        var target = new EventTarget();

        target.click = sinon.spy();
        target.addEventListener("keydown", Assistive.handleSpaceEnter);
        target.dispatchEvent(event);
        assert.calledOnce(target.click);
    });

    test("#handleClickSpaceEnter should call the callback on mouse click, Space and Enter, but ignore other keypresses", function () {
        var callback = sinon.spy();

        Assistive.handleClickSpaceEnter(new MouseEvent('click'), callback);
        equal(callback.callCount, 1, "callback called for a mouse click");

        Assistive.handleClickSpaceEnter(new KeyboardEvent('keydown', { key: ' ' }), callback);
        equal(callback.callCount, 2, "callback called for Spacebar key");

        Assistive.handleClickSpaceEnter(new KeyboardEvent('keydown', { key: 'Enter' }), callback);
        equal(callback.callCount, 3, "callback called for Enter key");

        Assistive.handleClickSpaceEnter(new KeyboardEvent('keydown', { key: 'Tab' }), callback);
        equal(callback.callCount, 3, "callback NOT called for Tab key");
    });

    module("Assistive configureRovingTabindex", {
        setup: function setup() {
            var fixture = document.getElementById("qunit-fixture");
            fixture.innerHTML = "<button id='dummy1'>Dummy 1</button>" + "<div id='toolbar'>" + "<button id='bold'>Bold</button>" + "<button id='italic'>Italic</button>" + "<button id='underline'>Underline</button>" + "<a href='#' id='insert-link'>Insert link</a>" + "<a href='#' id='insert-attachment'>Insert attachment</a>" + "</div>" + "<button id='dummy2'>Dummy 2</button>";
        },
        teardown: function teardown() {
            var fixture = document.getElementById("qunit-fixture");
            fixture.innerHTML = "";
        }
    });

    test("#configureRovingTabindex should add tabindex='0' on the container and tabindex='-1' to inner items", function () {
        var toolbar = document.getElementById("toolbar");
        Assistive.configureRovingTabindex(toolbar);

        equal(toolbar.getAttribute("tabindex"), 0, "Toolbar should have tabindex='0' as an entry-point");
        equal(toolbar.querySelectorAll("[tabindex='-1']").length, 5, "Toolbar items should have tabindex='-1' by default");
    });

    test("#configureRovingTabindex should operate with focus correctly", function () {
        var toolbar = document.getElementById("toolbar");
        Assistive.configureRovingTabindex(toolbar);

        toolbar.focus();
        var bold = document.getElementById("bold");
        equal(document.activeElement, bold, "Focus should move to the first item after focusing the container");
        equal(toolbar.getAttribute("tabindex"), -1, "Toolbar should have tabindex='-1' when focus is inside");
        equal(bold.getAttribute("tabindex"), 0, "Active item should have tabindex='0'");

        toolbar.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));

        var italic = document.getElementById("italic");
        equal(document.activeElement, italic, "Focus should move to the next item after pressing Arrow Right");

        toolbar.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
        toolbar.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));

        var insertAttachment = document.getElementById("insert-attachment");
        equal(document.activeElement, insertAttachment, "Focus should move to the last item after pressing Arrow Left for two times");

        var focusoutEvent = new Event("focusout");
        focusoutEvent.relatedTarget = document.getElementById("dummy2");
        toolbar.dispatchEvent(focusoutEvent);
        equal(toolbar.getAttribute("tabindex"), 0, "Toolbar should have tabindex='0' as an entry-point");
        equal(toolbar.querySelectorAll("[tabindex='-1']").length, 5, "Toolbar items should have tabindex='-1' when the focus is not inside");
    });

    test("#configureRovingTabindex cleanup works correctly", function () {
        var toolbar = document.getElementById("toolbar");
        var cleanup = Assistive.configureRovingTabindex(toolbar);

        cleanup();

        equal(toolbar.getAttribute("tabindex"), null, "Toolbar shouldn't have tabindex after cleanup");
        equal(toolbar.querySelectorAll("[tabindex='0']").length, 5, "Toolbar items should have tabindex='0' after cleanup");
    });
});
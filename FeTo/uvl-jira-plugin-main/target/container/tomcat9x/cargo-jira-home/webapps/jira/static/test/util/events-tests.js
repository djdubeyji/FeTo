AJS.test.require("jira.webresources:jira-events", function () {
    'use strict';

    var Events = require('jira/util/events');
    var jQuery = require('jquery');

    var EVENT_NAME = "foo";

    module("JIRA Events", {
        setup: function setup() {
            this.sandbox = sinon.sandbox.create();

            this.loggerErrorStub = this.sandbox.stub(require('jira/util/logger'), 'error');
        },
        teardown: function teardown() {
            this.sandbox.restore();
            Events.unbind(EVENT_NAME);
        }
    });

    test("Can trigger events", function () {
        var callback = this.sandbox.spy();
        Events.bind(EVENT_NAME, callback);
        Events.trigger(EVENT_NAME, ["bar"]);

        equal(callback.callCount, 1);
        ok(jQuery.inArray(callback.getCall(0).args, "bar"));
    });

    test("Triggers jQuery events", function () {
        var callback = this.sandbox.spy();
        Events.bind(EVENT_NAME, callback);
        Events.trigger(EVENT_NAME);

        ok(callback.getCall(0).args[0] instanceof jQuery.Event);
    });

    test("Bind adds an event", function () {
        var handler = this.sandbox.spy();
        Events.bind(EVENT_NAME, handler);
        Events.trigger(EVENT_NAME);

        equal(handler.callCount, 1, "called when bound");
    });

    test("Unbind removes the event", function () {
        var handler = this.sandbox.spy();
        Events.bind(EVENT_NAME, handler);
        Events.trigger(EVENT_NAME);

        equal(handler.callCount, 1, "called when bound");

        Events.unbind(EVENT_NAME, handler);
        Events.trigger(EVENT_NAME);

        equal(handler.callCount, 1, "should not be called any more");
    });

    test("Binds events to the document", function () {
        var handler = this.sandbox.spy();
        jQuery(document).bind(EVENT_NAME, handler);
        Events.bind(EVENT_NAME, handler);
        Events.trigger(EVENT_NAME);

        equal(handler.callCount, 2);
    });

    test("Isolates handlers (catches JS error)", function () {
        var badActorCallback = this.sandbox.stub().throws("TypeError");
        var regularCallback = this.sandbox.spy();
        Events.bind(EVENT_NAME, badActorCallback);
        Events.bind(EVENT_NAME, regularCallback);

        Events.trigger(EVENT_NAME);

        sinon.assert.calledOnce(badActorCallback);
        sinon.assert.calledOnce(regularCallback);

        sinon.assert.calledOnce(this.loggerErrorStub);
        sinon.assert.calledWithExactly(this.loggerErrorStub, 'An error occurred in one of the callback passed to jira/util/events', sinon.match.defined);
    });

    test("Wrapping preserves params", function () {
        var callback = this.sandbox.spy();
        Events.bind(EVENT_NAME, callback);
        Events.trigger(EVENT_NAME, ["bar", 123]);

        sinon.assert.calledOnce(callback);
        sinon.assert.calledWithExactly(callback, sinon.match.instanceOf(jQuery.Event), "bar", 123);
    });

    test("Wrapping preserves the context", function () {
        var contextAwareCallback = function contextAwareCallback() {
            equal(this, document);
        };
        Events.bind(EVENT_NAME, contextAwareCallback);

        Events.trigger(EVENT_NAME);
    });
});
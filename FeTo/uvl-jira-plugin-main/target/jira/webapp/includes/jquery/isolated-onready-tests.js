AJS.test.require(['jira.webresources:jquery'], function () {
    'use strict';

    var $ = require('jquery');
    var logger = require('jira/util/logger');

    module('jira/jquery/isolated-onready', {
        setup: function setup() {
            this.sandbox = sinon.sandbox.create();

            this.loggerErrorStub = this.sandbox.stub(logger, 'error');
            this.$readyStub = this.sandbox.spy($.fn, 'ready');
        },
        teardown: function teardown() {
            this.sandbox.restore();
        },
        assertOnReadyCallback: function assertOnReadyCallback(callback) {
            sinon.assert.calledOnce(callback);
            sinon.assert.calledOn(callback, document);
            sinon.assert.calledWithExactly(callback, $);
        }
    });

    test('Isolates jQuery onReady handlers (catches JS error)', function () {
        var badActorCallback = this.sandbox.stub().throws('TypeError');
        var regularCallback1 = this.sandbox.spy();
        var regularCallback2 = this.sandbox.spy();

        $(badActorCallback);
        $(regularCallback1);
        $(regularCallback2);

        this.assertOnReadyCallback(badActorCallback);
        this.assertOnReadyCallback(regularCallback1);
        this.assertOnReadyCallback(regularCallback2);

        sinon.assert.calledOnce(this.loggerErrorStub);
        sinon.assert.calledWithExactly(this.loggerErrorStub, 'An error occurred in one of the jQuery onReady callbacks', sinon.match.defined);
    });

    test('The overwrite preserves the return value and the context of the original $ready fn', function () {
        var badActorCallback = this.sandbox.stub().throws('TypeError');
        var regularCallback = this.sandbox.spy();

        $(badActorCallback);
        $(regularCallback);

        equal(this.$readyStub.callCount, 2);
        ok(this.$readyStub.returnValues[0][0] === document);
        ok(this.$readyStub.returnValues[1][0] === document);
    });

    test('Exotic and deprecated ways of attaching onReady handlers should be also isolated', function () {
        var callback1 = this.sandbox.stub().throws('TypeError 1');
        var callback2 = this.sandbox.stub().throws('TypeError 2');
        var callback3 = this.sandbox.stub().throws('TypeError 3');
        var callback4 = this.sandbox.stub().throws('TypeError 4');

        $(document).ready(callback1);
        $('document').ready(callback2);
        $('img').ready(callback3);
        $().ready(callback4);

        this.assertOnReadyCallback(callback1);
        this.assertOnReadyCallback(callback2);
        this.assertOnReadyCallback(callback3);
        this.assertOnReadyCallback(callback4);

        sinon.assert.callCount(this.loggerErrorStub, 4);
    });

    test('Using the same handler twice should work as before', function () {
        var badActorCallback = this.sandbox.stub().throws('TypeError');

        $(badActorCallback);
        $(badActorCallback);

        sinon.assert.calledTwice(badActorCallback);
        sinon.assert.calledTwice(this.loggerErrorStub);
    });
});
AJS.test.require("jira.webresources:init-on-dcl", function () {
    'use strict';

    // sinon can't stub readyState for some reason

    var stubReadyState = function stubReadyState(value) {
        Object.defineProperty(window.document, 'readyState', {
            writable: true,
            value: value
        });
    };

    module('jira/util/on-load', {
        setup: function setup() {
            this.onLoad = require('jira/util/init-on-dcl');
            this.cachedReadyState = document.readyState;

            this.sandbox = sinon.sandbox.create();
        },
        teardown: function teardown() {
            this.sandbox.restore();

            // set a 'complete' readyState once tests are finished
            stubReadyState(this.cachedReadyState);
        }
    });

    test('Event listener is being attached when document is in loading phase', function () {
        stubReadyState('loading');

        var callback = this.sandbox.spy();
        var addEventListenerSpy = this.sandbox.spy(document, 'addEventListener');

        this.onLoad(callback);

        equal(callback.callCount, 0, 'onLoad callback doesn\'t fire');
        equal(addEventListenerSpy.callCount, 1, 'DOMContentLoaded listener has been attached');
    });

    test('Callback is being called when document is in interactive phase', function (assert) {
        stubReadyState('interactive');

        var callback = this.sandbox.spy();

        var done = assert.async();

        this.onLoad(callback);

        setTimeout(function () {
            equal(callback.callCount, 1, 'onLoad callback does fire');

            done();
        }, 1);
    });

    test('Callback is being called when document loaded (complete)', function (assert) {
        stubReadyState('complete');

        var callback = this.sandbox.spy();

        var done = assert.async();

        this.onLoad(callback);

        setTimeout(function () {
            equal(callback.callCount, 1, 'onLoad callback does fire');

            done();
        }, 1);
    });
});
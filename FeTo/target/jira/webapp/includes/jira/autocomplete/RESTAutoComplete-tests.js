AJS.test.require(['jira.webresources:autocomplete'], function () {
    'use strict';

    var jQuery = require('jquery');
    var Objects = require('jira/util/objects');
    var RestAutoComplete = require('jira/autocomplete/rest-autocomplete');

    var testServerResponse = '{"elements":[{"name":"something","html":"<div></div>"}],"total":1}';
    var testUrl = 'my/test/url';

    QUnit.config.testTimeout = 5000; // milliseconds until tests timeout

    module('RESTAutoComplete', {
        initRestAutoComplete: function initRestAutoComplete() {
            var restAutoComplete = Objects.begetObject(RestAutoComplete);
            restAutoComplete.queryDelay = 0; // Delay before doing the query
            restAutoComplete.minQueryLength = 2; // Minimum length of the query do to a request.
            restAutoComplete.getAjaxParams = function () {
                // Each AutoComplete file implements it
                return {
                    url: testUrl,
                    data: {},
                    dataType: 'json',
                    type: 'GET'
                };
            };
            return restAutoComplete;
        },
        setup: function setup() {
            this.sandbox = sinon.sandbox.create();
            this.server = this.sandbox.useFakeServer();
            this.server.autoRespond = true;
            this.server.respondWith('GET', new RegExp(testUrl), [200, { 'Content-Type': 'application/json' }, testServerResponse]);
            this.restAutoComplete = this.initRestAutoComplete();
        },
        teardown: function teardown() {
            this.server.restore();
            this.sandbox.restore();
        }
    });

    test('RenderSuggestions is not called when response container is undefined', function () {
        this.restAutoComplete.responseContainer = undefined;
        var renderSuggestionsStub = this.sandbox.stub(this.restAutoComplete, 'renderSuggestions');

        // Perform call
        this.restAutoComplete.dispatcher('1234');

        ok(renderSuggestionsStub.notCalled, 'renderSuggestions was not called');
    });

    test('RenderSuggestions is not called when response container is null', function () {
        this.restAutoComplete.responseContainer = null;
        var renderSuggestionsStub = this.sandbox.stub(this.restAutoComplete, 'renderSuggestions');

        // Perform call
        this.restAutoComplete.dispatcher('1234');

        ok(renderSuggestionsStub.notCalled, 'renderSuggestions was not called');
    });

    test('RenderSuggestions is called when response container is initialized and there is a saved response', function () {
        var savedResponseValue = { a: 1, b: 2 };
        var savedResponseStub = this.sandbox.stub(this.restAutoComplete, 'getSavedResponse');
        savedResponseStub.returns(savedResponseValue);
        var renderSuggestionsStub = this.sandbox.stub(this.restAutoComplete, 'renderSuggestions');

        // Initialize the responseContainer
        this.restAutoComplete.field = jQuery('<div>');
        this.restAutoComplete.buildResponseContainer();

        // Perform call
        this.restAutoComplete.dispatcher('1234');

        ok(renderSuggestionsStub.calledOnce, 'renderSuggestions was called');
        ok(savedResponseValue === renderSuggestionsStub.args[0][0], 'renderSuggestions received correct parameters.');
    });

    test('RenderSuggestions is called when response container is initialized and there is no saved response.', function (assert) {
        var done = assert.async();

        this.restAutoComplete.renderSuggestions = function (data) {
            ok(testServerResponse === JSON.stringify(data), 'renderSuggestions was called.');
            done();
        };

        // Initialize the responseContainer
        this.restAutoComplete.field = jQuery('<div>');
        this.restAutoComplete.buildResponseContainer();

        // Perform call
        this.restAutoComplete.dispatcher('1234');
    });
});
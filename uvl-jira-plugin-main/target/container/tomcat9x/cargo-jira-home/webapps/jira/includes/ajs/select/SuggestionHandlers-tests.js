AJS.test.require(["jira.webresources:select-pickers"], function () {
    "use strict";

    var _ = require("underscore");
    var jQuery = require("jquery");
    var SelectModel = require("jira/ajs/select/select-model");
    var AssigneeSuggestHandler = require("jira/ajs/select/suggestions/assignee-suggest-handler");
    var CheckboxMultiSelectSuggestHandler = require("jira/ajs/select/suggestions/checkbox-multi-select-suggest-handler");
    var OnlyNewItemsSuggestHandler = require("jira/ajs/select/suggestions/only-new-items-suggest-handler");

    module("CheckboxMultiSelectSuggestHandler", {
        setup: function setup() {
            this.sandbox = sinon.sandbox.create();
            this.clock = this.sandbox.useFakeTimers();
            this.server = this.sandbox.useFakeServer();
        },
        teardown: function teardown() {
            this.clock.restore();
            this.server.restore();
        }
    });

    test("Does not show duplicate selected values for empty query", function () {
        var $el = jQuery("<select multiple='true'>" + "<optgroup label='stuff'><option value='xxx' selected='true'></option></optgroup>" + "<optgroup label='more'><option value='xxx' selected='true'></option></optgroup>" + "</select>");
        var model = new SelectModel({
            element: $el
        });
        var suggestHandler = new CheckboxMultiSelectSuggestHandler({}, model);

        var descriptors = suggestHandler.formatSuggestions([], "");

        equal(descriptors.length, 1);
        var optGroup = descriptors[0];
        equal(optGroup.items().length, 1);
    });

    test("Footer text only shows for empty query", function () {
        expect(2);
        var $el = jQuery("<select multiple='true'>" + "<optgroup label='stuff'><option value='xxx' selected='true'></option></optgroup>" + "</select>");
        var model = new SelectModel({
            element: $el
        });
        var suggestHandler = new AssigneeSuggestHandler({ ajaxOptions: { url: "", query: true } }, model);
        suggestHandler.execute("").done(function (descriptors) {
            equal("user.picker.ajax.short.desc", descriptors[0].footerText());
        });
        suggestHandler.execute("a").done(function (descriptors) {
            ok(!descriptors[0].footerText());
        });
    });

    test("Clear link shows when there are 2 or more suggestions", function () {
        expect(2);
        var $el = jQuery("<select multiple='true'>" + "<optgroup label='stuff'><option value='zzz' selected='true'></option><option value='xxx' selected='true'></option></optgroup>" + "</select>");
        var model = new SelectModel({
            element: $el
        });
        var suggestHandler = new CheckboxMultiSelectSuggestHandler({}, model);

        suggestHandler.execute("").done(function (descriptors) {
            equal(jQuery(descriptors[0].actionBarHtml()).find(".clear-all").length, 1, "expected clear all to be added because there are 2 selected");
        });

        $el = jQuery("<select multiple='true'>" + "<optgroup label='stuff'><option value='xxx' selected='true'></option><option value='xxx2'></optgroup>" + "</select>");
        model = new SelectModel({
            element: $el
        });
        suggestHandler = new CheckboxMultiSelectSuggestHandler({}, model);
        suggestHandler.execute("").done(function (descriptors) {
            equal(jQuery(descriptors[0].actionBarHtml()).find(".clear-all").length, 0, "expected clear all not to be added because there is only 1 selected");
        });
    });

    test("Cancels unnecessary requests", function () {
        var ajaxDescriptorFetcher = new AJS.AjaxDescriptorFetcher({
            query: true,
            formatResponse: function formatResponse(data) {
                return new AJS.ItemDescriptor({ value: data.correctData, label: data.correctData });
            }
        });
        var firstRequestSpy = sinon.spy();
        var secondRequestSpy = sinon.spy();

        ajaxDescriptorFetcher.execute("a").done(firstRequestSpy);
        ajaxDescriptorFetcher.execute("ab").done(secondRequestSpy);

        ok(this.server.requests[0].aborted, "first request should be aborted");
        equal(firstRequestSpy.callCount, 0, "first request should never return.");

        this.server.requests[1].respond(200, { "Content-Type": "application/json" }, JSON.stringify({ correctData: "correctData" }));
        equal(secondRequestSpy.args[0][0].value(), "correctData", "correct data is returned");
    });

    test("Will not search when query is shorter than minQueryLength parameter", function () {
        var ajaxDescriptorFetcher = new AJS.AjaxDescriptorFetcher({
            query: true,
            minQueryLength: 2,
            formatResponse: function formatResponse(data) {
                return new AJS.ItemDescriptor({ value: data.correctData, label: data.correctData });
            }
        });
        var firstRequestSpy = sinon.spy();
        var secondRequestSpy = sinon.spy();

        ajaxDescriptorFetcher.execute("a").done(firstRequestSpy);
        equal(firstRequestSpy.args[0][0], undefined, "first request is not returning data");
        equal(this.server.requests.length, 0, "server is not called");

        ajaxDescriptorFetcher.execute("ab").done(secondRequestSpy);
        this.server.requests[0].respond(200, { "Content-Type": "application/json" }, JSON.stringify({ correctData: "correctData" }));
        equal(this.server.requests.length, 1, "server was called once on another keystroke");
        equal(secondRequestSpy.args[0][0].value(), "correctData", "correct data is returned");
    });

    test("Uses configurable debouncing for searching", function () {
        var ajaxDescriptorFetcher = new AJS.AjaxDescriptorFetcher({
            minQueryLength: 0,
            keyInputPeriod: 200,
            formatResponse: function formatResponse(data) {
                return new AJS.ItemDescriptor({ value: data.correctData, label: data.correctData });
            }
        });
        var requestSpy = sinon.spy();

        ajaxDescriptorFetcher.execute("a").done();
        ajaxDescriptorFetcher.execute("ab").done();
        ajaxDescriptorFetcher.execute("abc").done();
        ajaxDescriptorFetcher.execute("abcd").done(requestSpy);
        equal(this.server.requests.length, 0, "request is not sent immediately");
        this.clock.tick(170);
        equal(this.server.requests.length, 0, "request is not sent after default delay, but respects configuration");
        this.clock.tick(100);
        equal(this.server.requests.length, 1, "only one request was sent");
        this.server.requests[0].respond(200, { "Content-Type": "application/json" }, JSON.stringify({ correctData: "correctData" }));
        equal(requestSpy.args[0][0].value(), "correctData", "correct data is returned");

        this.clock.restore();
        this.server.restore();
    });

    test("Keeps last response with debounced queries", function () {
        var ajaxDescriptorFetcher = new AJS.AjaxDescriptorFetcher({
            keyInputPeriod: 10,
            minQueryLength: 2,
            formatResponse: function formatResponse(data) {
                return new AJS.ItemDescriptor({ value: data.correctData, label: data.correctData });
            }
        });
        var firstRequestSpy = sinon.spy();
        var secondRequestSpy = sinon.spy();

        ajaxDescriptorFetcher.execute("ab").done(firstRequestSpy);
        this.clock.tick(20);
        this.server.requests[0].respond(200, { "Content-Type": "application/json" }, JSON.stringify({ correctData: "correctData" }));
        ajaxDescriptorFetcher.execute("a").done(secondRequestSpy);
        this.clock.tick(20);

        equal(firstRequestSpy.args[0][0].value(), "correctData", "correct data is returned");
        equal(secondRequestSpy.args[0][0].value(), "correctData", "second request is returning last response");
    });

    test("Preserves search results items even if they already are in the suggestions", function () {
        var $el = jQuery("<select multiple='true'></select>");
        var model = new SelectModel({
            element: $el
        });

        var server = sinon.fakeServer.create();
        var suggestHandler = new CheckboxMultiSelectSuggestHandler({
            content: 'mixed',
            ajaxOptions: {
                url: 'fake',
                query: true,
                formatResponse: function formatResponse(data) {
                    return new AJS.ItemDescriptor({ value: data.value, label: data.label });
                }
            }
        }, model);

        model.getAllDescriptors = function () {
            return [new AJS.ItemDescriptor({ value: "val1", label: "Value 1" }), new AJS.ItemDescriptor({ value: "val2", label: "Value 2" })];
        };
        suggestHandler.execute("query").done(function (descriptors) {
            equal(descriptors[0].items()[0].value(), "val1");
            equal(descriptors[0].items()[0].label(), "*Value 1*");

            equal(descriptors[0].items()[1].value(), "val2");
            equal(descriptors[0].items()[1].label(), "Value 2");

            equal(descriptors[0].items().length, 2);
        });
        server.requests[0].respond(200, { "Content-Type": "application/json" }, JSON.stringify({
            value: "val1",
            label: "*Value 1*"
        }));
    });

    test("MixedDescriptorFetcher with suggestion at top", function () {
        var $el = jQuery("<select multiple='true'>" + "<optgroup label='stuff'><option value='xxx' selected='true'></option></optgroup>" + "</select>");
        var model = new AJS.SelectModel({
            element: $el
        });

        var server = sinon.fakeServer.create();
        var mixedDescriptorFetcher = new AJS.MixedDescriptorFetcher({
            ajaxOptions: {
                url: "fake",
                minQueryLength: 0,
                query: true,
                formatResponse: function formatResponse(response) {
                    return response;
                }
            },
            suggestionAtTop: true
        }, model);

        mixedDescriptorFetcher.execute("").done(function (descriptors) {
            ok(_.isEqual(descriptors[0], model.getAllDescriptors()[0]));
        });

        server.requests[0].respond(200, { "Content-Type": "application/json" }, JSON.stringify({ value: "val1", label: "*Value 1*" }));
    });

    test("MixedDescriptorFetcher with suggestion at bottom", function () {

        var $el = jQuery("<select multiple='true'>" + "<optgroup label='stuff'><option value='xxx' selected='true'></option></optgroup>" + "</select>");
        var model = new AJS.SelectModel({
            element: $el
        });

        var server = sinon.fakeServer.create();
        var mixedDescriptorFetcher = new AJS.MixedDescriptorFetcher({
            ajaxOptions: {
                url: "fake",
                minQueryLength: 0,
                query: true,
                formatResponse: function formatResponse(response) {
                    return response;
                }
            },
            suggestionAtTop: false
        }, model);

        mixedDescriptorFetcher.execute("").done(function (descriptors) {
            ok(_.isEqual(descriptors[1], model.getAllDescriptors()[0]));
        });

        server.requests[0].respond(200, { "Content-Type": "application/json" }, JSON.stringify({ value: "val1", label: "*Value 1*" }));
    });

    module("OnlyNewItemsSuggestHandler", {
        setup: function setup() {
            var $el = jQuery("<select multiple='true'>" + "<option value='stuff'>Stuff</option>" + "<option value='more'>A ? for you</option>" + "</select>");
            var model = new SelectModel({
                element: $el
            });
            this.suggestHandler = new OnlyNewItemsSuggestHandler({
                userEnteredOptionsMsg: "Create new" // enable mirroring
            }, model);
        }
    });

    test("Query that doesn't match any existing items gets mirrored", function () {
        strictEqual(this.suggestHandler.validateMirroring("Other"), true);
    });

    test("Query that matches an existing item doesn't get mirrored", function () {
        strictEqual(this.suggestHandler.validateMirroring("Stuff"), false);
    });

    test("Query that only partially matches an existing item gets mirrored", function () {
        strictEqual(this.suggestHandler.validateMirroring("Stuf"), true);
    });

    test("Query with a matching item that differs only by case does not get mirrored", function () {
        strictEqual(this.suggestHandler.validateMirroring("sTuFf"), false);
    });

    test("Query with special symbols that differs only by case does not get mirrored", function () {
        strictEqual(this.suggestHandler.validateMirroring("a ? for YOU"), false);
    });

    module("SelectSuggestHandler", {
        setup: function setup() {
            this.sandbox = sinon.sandbox.create();
            this.context = AJS.test.mockableModuleContext();

            this.SuggestHelper = { removeSelected: this.sandbox.stub(), createDescriptorFetcher: this.sandbox.stub() };
            this.context.mock("jira/ajs/select/suggestions/suggest-helper", this.SuggestHelper);

            this.SelectSuggestHandler = this.context.require("jira/ajs/select/suggestions/select-suggest-handler");
        },
        teardown: function teardown() {
            this.sandbox.restore();
        }
    });

    test("Suggest handler optionally removes selected values", function () {
        var model = {
            getDisplayableSelectedDescriptors: this.sandbox.stub()
        };

        var handlerWithoutDeduplication = new this.SelectSuggestHandler({ disableRemoveSelected: true }, model);
        handlerWithoutDeduplication.formatSuggestions([], "test");
        sinon.assert.notCalled(this.SuggestHelper.removeSelected, "Does not remove selected values with disableRemoveSelected");

        var handlerWithDeduplication = new this.SelectSuggestHandler({}, model);
        handlerWithDeduplication.formatSuggestions([], "test");
        sinon.assert.calledOnce(this.SuggestHelper.removeSelected, "Removes selected values by default");
    });

    test("Search includes footer text from Ajax response when present", function () {
        var model = new SelectModel({
            element: jQuery("<select multiple='true'></select>")
        });
        var server = sinon.fakeServer.create();
        var suggestHandler = new CheckboxMultiSelectSuggestHandler({
            content: 'mixed',
            ajaxOptions: {
                url: 'fake',
                query: true,
                formatResponse: function formatResponse(data) {
                    return new AJS.GroupDescriptor({
                        items: [new AJS.ItemDescriptor({ value: data.value, label: data.label })],
                        footerText: "TEXT",
                        fetchedThroughAjaxCall: true
                    });
                }
            }
        }, model);

        model.getAllDescriptors = function () {
            return [new AJS.GroupDescriptor({
                items: [new AJS.ItemDescriptor({ value: "val1", label: "Value 1" })]
            }), new AJS.GroupDescriptor({
                items: [new AJS.ItemDescriptor({ value: "val2", label: "Value 2" })],
                fetchedThroughAjaxCall: false
            })];
        };
        suggestHandler.execute("query").done(function (descriptors) {
            equal(descriptors[0].items().length, 2);
            equal(descriptors[0].footerText(), "TEXT");
        });
        server.requests[0].respond(200, { "Content-Type": "application/json" }, JSON.stringify({
            value: "val1",
            label: "*Value 1*"
        }));
    });

    test("Search omits footer text from Ajax response when absent", function () {
        var model = new SelectModel({
            element: jQuery("<select multiple='true'></select>")
        });
        var server = sinon.fakeServer.create();
        var suggestHandler = new CheckboxMultiSelectSuggestHandler({
            content: 'mixed',
            ajaxOptions: {
                url: 'fake',
                query: true,
                formatResponse: function formatResponse(data) {
                    return new AJS.GroupDescriptor({
                        items: [new AJS.ItemDescriptor({ value: data.value, label: data.label })],
                        fetchedThroughAjaxCall: true
                    });
                }
            }
        }, model);

        model.getAllDescriptors = function () {
            return [new AJS.GroupDescriptor({
                items: [new AJS.ItemDescriptor({ value: "val1", label: "Value 1" })],
                fetchedThroughAjaxCall: false,
                footerText: "TEXT" // should not be picked since 'fetchedThroughAjaxCall' is false.
            })];
        };
        suggestHandler.execute("query").done(function (descriptors) {
            equal(descriptors[0].items().length, 1);
            equal(descriptors[0].footerText(), undefined);
        });
        server.requests[0].respond(200, { "Content-Type": "application/json" }, JSON.stringify({
            value: "val1",
            label: "*Value 1*"
        }));
    });
});
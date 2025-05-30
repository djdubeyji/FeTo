AJS.test.require(["jira.webresources:searchers"], function () {
    'use strict';

    var _this = this;

    var formatter = require("jira/util/formatter");
    var projectPickerOptions = require("jira/searchers/element/project-picker-options");
    var testNames = ["test 1", "test 2", "3 test"];

    module('projectPickerOptions', {
        setup: function setup() {
            _this.sandbox = sinon.sandbox.create();
            _this.sandbox.stub(formatter, "format", function () {
                return "TEXT";
            });
            _this.createProject = function (name, id) {
                return {
                    id: id,
                    avatar: "http://url/avatar/" + id,
                    name: name,
                    html: "test project <strong>" + name + "</strong> (<strong>" + name + "</strong>)"
                };
            };

            _this.createProjects = function (total) {
                return {
                    projects: testNames.map(_this.createProject),
                    total: total ? total : testNames.length
                };
            };
        },
        teardown: function teardown() {
            _this.sandbox.restore();
        }
    });

    test('should setup picker options', function () {
        // when
        var actualOptions = projectPickerOptions({});

        // then
        equal(actualOptions.maxInlineResultsDisplayed, 100, 'maxInlineResultsDisplayed is defined by common options');
        equal(actualOptions.maxResultsDisplayedPerGroup, 100, 'maxResultsDisplayedPerGroup is defined by common options');
    });

    test("should setup ajax options", function () {
        var actualOptions = projectPickerOptions({});

        ok(actualOptions.ajaxOptions, "ajaxOptions defined");
        ok(actualOptions.ajaxOptions.url, "REST endpoint path defined");
        ok(actualOptions.ajaxOptions.data.maxResults >= 1, "maxResults query param is set to equal or higher than 1");
        ok(!actualOptions.query, 'Uses debouncing');
        ok(typeof actualOptions.ajaxOptions.formatResponse === "function", "formatResponse method defined");
    });

    test("should keep input options", function () {
        var testOptions = {
            test1: "test 1 option",
            test2: 2,
            test3: false
        };

        var actualOptions = projectPickerOptions(testOptions);

        equal(actualOptions.test1, testOptions.test1, "keep string property");
        equal(actualOptions.test2, testOptions.test2, "keep numeric property");
        equal(actualOptions.test3, testOptions.test3, "keep boolean property");
    });

    test("should format response", function () {
        var testData = _this.createProjects();

        var actualOptions = projectPickerOptions({});
        /**
         * actualResponse {items: []}
         */
        var actualResponse = actualOptions.ajaxOptions.formatResponse(testData);
        testData.projects.forEach(function (testProject) {
            return ok(actualResponse[0].items().some(function (item) {
                return item.value() === testProject.id && item.icon() === testProject.avatar && item.html() === testProject.html && item.label() === "test project " + testProject.name + " (" + testProject.name + ")";
            }), "should format response for project id:" + testProject.id + ", name:" + testProject.name);
        });
        ok(actualResponse[0].fetchedThroughAjaxCall() === true, "marked as ajax call response");
    });

    test("should include footer text when number of projects returned was trimmed", function () {
        var testData = _this.createProjects(5);
        var actualOptions = projectPickerOptions({});

        var actualResponse = actualOptions.ajaxOptions.formatResponse(testData);

        ok(actualResponse[0].footerText() === "TEXT", "footer text is set");
    });

    test("should omit footer text when all projects were returned", function () {
        var testData = _this.createProjects();
        var actualOptions = projectPickerOptions({});

        var actualResponse = actualOptions.ajaxOptions.formatResponse(testData);

        ok(!actualResponse[0].footerText(), "footer text is not set");
    });
});
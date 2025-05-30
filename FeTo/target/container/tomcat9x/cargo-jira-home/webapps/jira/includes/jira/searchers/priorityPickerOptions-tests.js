AJS.test.require(['jira.webresources:searchers'], function () {
    'use strict';

    var _this = this;

    var formatter = require('jira/util/formatter');
    var priorityPickerOptions = require('jira/searchers/element/priority-picker-options');
    var testNames = ['test 1', 'test 2', '3 test'];

    var initOptions = {
        baseAjaxOptions: {
            maxResults: 45,
            startAt: 5
        }
    };

    module('priorityPickerOptions', {
        setup: function setup() {
            _this.sandbox = sinon.sandbox.create();
            _this.sandbox.stub(formatter, 'format', function (key) {
                return key;
            });
            _this.createPriority = function (name, id) {
                return {
                    id: id,
                    iconUrl: 'http://url/' + id,
                    name: name,
                    description: name
                };
            };

            _this.createPriorities = function (total) {
                return {
                    values: testNames.map(_this.createPriority),
                    total: total ? total : testNames.length
                };
            };
        },
        teardown: function teardown() {
            _this.sandbox.restore();
        }
    });

    test('should setup ajax options', function () {
        var actualOptions = priorityPickerOptions(initOptions);

        ok(actualOptions.ajaxOptions, 'ajaxOptions defined');
        ok(actualOptions.ajaxOptions.url, 'REST endpoint path defined');
        ok(actualOptions.ajaxOptions.data.maxResults >= 1, 'maxResults query param is set to equal or higher than 1');
        ok(!actualOptions.query, 'Uses debouncing');
        ok(typeof actualOptions.ajaxOptions.formatResponse === 'function', 'formatResponse method defined');
    });

    test('should keep input options', function () {
        var testOptions = {
            test1: 'test 1 option',
            test2: 2,
            test3: false
        };

        var actualOptions = priorityPickerOptions(Object.assign(initOptions, testOptions));

        equal(actualOptions.test1, testOptions.test1, 'keep string property');
        equal(actualOptions.test2, testOptions.test2, 'keep numeric property');
        equal(actualOptions.test3, testOptions.test3, 'keep boolean property');
    });

    test('should format response', function () {
        var testData = _this.createPriorities();

        var actualOptions = priorityPickerOptions(initOptions);
        /**
         * actualResponse {items: []}
         */
        var actualResponse = actualOptions.ajaxOptions.formatResponse(testData);
        testData.values.forEach(function (testPriority) {
            return ok(actualResponse[0].items().some(function (item) {
                return item.value() === testPriority.id && item.label() === testPriority.name;
            }), 'should format response for priority id:' + testPriority.id + ', name:' + testPriority.name);
        });
        ok(actualResponse[0].fetchedThroughAjaxCall() === true, 'marked as ajax call response');
    });

    test('should include footer text when number of priorities returned was trimmed', function () {
        var testData = _this.createPriorities(5);
        var actualOptions = priorityPickerOptions(initOptions);

        var actualResponse = actualOptions.ajaxOptions.formatResponse(testData);

        ok(actualResponse[0].footerText() === 'common.concepts.too.many.matches', 'footer text is set with proper translation key');
    });

    test('should omit footer text when all projects were returned', function () {
        var testData = _this.createPriorities();
        var actualOptions = priorityPickerOptions(initOptions);

        var actualResponse = actualOptions.ajaxOptions.formatResponse(testData);

        ok(!actualResponse[0].footerText(), 'footer text is not set');
    });
});
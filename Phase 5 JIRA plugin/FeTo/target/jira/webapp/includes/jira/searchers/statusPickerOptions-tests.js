AJS.test.require(['jira.webresources:searchers'], function () {
    'use strict';

    var _this = this;

    var formatter = require('jira/util/formatter');
    var statusPickerOptions = require('jira/searchers/element/status-picker-options');
    var testNames = ['test 1', 'test 2', '3 test'];

    var initOptions = {
        baseAjaxOptions: {
            projectIds: ['560', '450'],
            issueTypeIds: ['123']
        }
    };

    module('statusPickerOptions', {
        setup: function setup() {
            _this.sandbox = sinon.sandbox.create();
            _this.sandbox.stub(formatter, 'format', function (key) {
                return key;
            });
            _this.createStatus = function (name, id) {
                return {
                    id: id,
                    iconUrl: 'http://url/' + id,
                    name: name,
                    html: '' + name
                };
            };

            _this.createStatuses = function (total) {
                return {
                    values: testNames.map(_this.createStatus),
                    total: total ? total : testNames.length
                };
            };
        },
        teardown: function teardown() {
            _this.sandbox.restore();
        }
    });

    test('should setup ajax options', function () {
        var actualOptions = statusPickerOptions(initOptions);

        ok(actualOptions.ajaxOptions, 'ajaxOptions defined');
        ok(actualOptions.ajaxOptions.url, 'REST endpoint path defined');
        equal(actualOptions.ajaxOptions.data.maxResults, 100, 'maxResults query param is set to default value');
        equal(actualOptions.ajaxOptions.data.projectIds, initOptions.baseAjaxOptions.projectIds, 'projectIds query param is set');
        equal(actualOptions.ajaxOptions.data.issueTypeIds, initOptions.baseAjaxOptions.issueTypeIds, 'issueTypeIds query param is set');
        ok(!actualOptions.query, 'Uses debouncing');
        ok(typeof actualOptions.ajaxOptions.formatResponse === 'function', 'formatResponse method defined');
    });

    test('should keep input options', function () {
        var testOptions = {
            test1: 'test 1 option',
            test2: 2,
            test3: false
        };

        var actualOptions = statusPickerOptions(Object.assign(initOptions, testOptions));

        equal(actualOptions.test1, testOptions.test1, 'keep string property');
        equal(actualOptions.test2, testOptions.test2, 'keep numeric property');
        equal(actualOptions.test3, testOptions.test3, 'keep boolean property');
    });

    test('should format response', function () {
        var testData = _this.createStatuses();

        var actualOptions = statusPickerOptions(initOptions);
        /**
         * actualResponse {items: []}
         */
        var actualResponse = actualOptions.ajaxOptions.formatResponse(testData);
        testData.values.forEach(function (testStatus) {
            return ok(actualResponse[0].items().some(function (item) {
                return item.value() === testStatus.id && item.label() === testStatus.name;
            }), 'should format response for status id:' + testStatus.id + ', name:' + testStatus.name);
        });
        ok(actualResponse[0].fetchedThroughAjaxCall() === true, 'marked as ajax call response');
    });

    test('should create HTML element with proper attributes', function () {
        var testData = _this.createStatuses();

        var actualOptions = statusPickerOptions(initOptions);
        /**
         * actualResponse {items: []}
         */
        var actualResponse = actualOptions.ajaxOptions.formatResponse(testData);

        var $option = actualResponse[0].items()[0].model();

        ok($option[0].nodeName === 'OPTION', 'should be option element');
        ok($option.hasClass('imagebacked'), 'should contain imgagebacked class');
        ok($option.data('icon') === testData.values[0].iconUrl, 'should contain proper data-icon attribute');
        ok($option[0].innerText === testData.values[0].name, 'should contain proper innerText value');
    });

    test('should include footer text when number of statuses returned was trimmed', function () {
        var testData = _this.createStatuses(5);
        var actualOptions = statusPickerOptions(initOptions);

        var actualResponse = actualOptions.ajaxOptions.formatResponse(testData);

        ok(actualResponse[0].footerText() === 'common.concepts.too.many.matches', 'footer text is set with proper translation key');
    });

    test('should omit footer text when all projects were returned', function () {
        var testData = _this.createStatuses();
        var actualOptions = statusPickerOptions(initOptions);

        var actualResponse = actualOptions.ajaxOptions.formatResponse(testData);

        ok(!actualResponse[0].footerText(), 'footer text is not set');
    });
});
AJS.test.require(['jira.webresources:searchers'], function () {
    'use strict';

    var _this = this;

    var multiSelectCustomFieldPickerOptions = require('jira/searchers/element/multi-select-custom-field-picker-options');
    var formatter = require('jira/util/formatter');
    var wrmContextPath = require("wrm/context-path");
    var initOptions = {
        baseAjaxOptions: {
            customFieldId: 10101,
            projectIds: ['10001', '10003'],
            issueTypeIds: ['12003', '12005', '12008']
        }
    };

    var responseData = {
        options: [{
            id: 101234,
            value: 'Option 1'
        }, {
            id: 104352,
            value: 'Option A'
        }, {
            id: 987654,
            value: 'Awesome option'
        }],
        total: 3
    };

    module('multiSelectCustomFieldPickerOptions', {
        setup: function setup() {
            _this.sandbox = sinon.sandbox.create();
            _this.formatSpy = _this.sandbox.spy(formatter, 'format');
        },
        teardown: function teardown() {
            _this.sandbox.restore();
        }
    });

    test('should setup picker options', function () {
        // when
        var actualOptions = multiSelectCustomFieldPickerOptions(initOptions);

        // then
        equal(actualOptions.maxInlineResultsDisplayed, 100, 'maxInlineResultsDisplayed is defined by common options');
        equal(actualOptions.maxResultsDisplayedPerGroup, 100, 'maxResultsDisplayedPerGroup is defined by common options');
    });

    test('should setup ajax options', function () {
        // given
        var expectedCustomFieldId = initOptions.baseAjaxOptions.customFieldId;

        // when
        var actualOptions = multiSelectCustomFieldPickerOptions(initOptions);

        // then
        ok(actualOptions.ajaxOptions, 'AjaxOptions are defined');
        equal(actualOptions.ajaxOptions.url, wrmContextPath() + ('/rest/api/latest/customFields/' + expectedCustomFieldId + '/options'), 'REST endpoint path is defined');
        equal(actualOptions.ajaxOptions.data.maxResults, 100, 'maxResults is correctly set');
        ok(typeof actualOptions.ajaxOptions.formatResponse === 'function', 'formatResponse method is defined');
    });

    test('should set debouncing', function () {
        var actualOptions = multiSelectCustomFieldPickerOptions(initOptions);

        equal(!actualOptions.query, true, 'Debouncing is in use');
    });

    test('should correctly format the response', function () {
        // when
        var actualOptions = multiSelectCustomFieldPickerOptions(initOptions);
        var actualResponse = actualOptions.ajaxOptions.formatResponse(responseData);

        // then
        var groupDescriptor = actualResponse[0];
        var items = groupDescriptor.items();
        equal(items.length, responseData.options.length, 'Items have correct length');

        var doesItemsMatch = items.every(function (item, idx) {
            return item.label() === responseData.options[idx].value && item.value() === responseData.options[idx].id.toString();
        });
        ok(doesItemsMatch, 'Items have correct properties');

        equal(groupDescriptor.fetchedThroughAjaxCall(), true, 'GroupDescriptor is marked as having data from the server');
    });

    test('should not add footer text to items when all were returned', function () {
        // when
        var actualOptions = multiSelectCustomFieldPickerOptions(initOptions);
        var actualResponse = actualOptions.ajaxOptions.formatResponse(responseData);

        // then
        equal(actualResponse[0].footerText(), undefined, 'Footer text is not present');
    });

    test('should add footer text to items when not all were returned', function () {
        // given
        var croppedResponseData = {
            options: responseData.options,
            total: 5
        };

        // when
        var actualOptions = multiSelectCustomFieldPickerOptions(initOptions);
        var actualResponse = actualOptions.ajaxOptions.formatResponse(croppedResponseData);

        // then
        equal(_this.formatSpy.calledOnce, true, 'Formatter was called once');
        equal(_this.formatSpy.calledWith('common.concepts.too.many.matches', 2), true, 'Formatter was called with proper arguments');
        equal(actualResponse[0].footerText(), 'common.concepts.too.many.matches', 'Footer text is present');
    });
});
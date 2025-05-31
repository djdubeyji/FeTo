var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

AJS.test.require('jira.webresources:jira-global', function () {
    'use strict';

    var jQuery = require('jquery');
    var AssigneePicker = require('jira/field/assignee-picker');
    var _ = require('underscore');

    var ISSUE_KEY = 'AAA-1';
    var PROJECT_KEY = 'AAA';

    var createPicker = function createPicker(fixture, useNewEndpoint, setAssigneeEditIssueKey) {
        var pickerSelect = jQuery('\n            <select id="assignee" name="assignee" class="single-user-picker js-assignee-picker aui-ss-select" data-show-dropdown-button="true" data-user-type="assignee" data-container-class="long-field" data-use-new-endpoint="' + useNewEndpoint + '" multiple="multiple" style="display: none;">\n                <optgroup id="assignee-group-suggested" label="Suggestions" data-weight="0">\n                    <option value="admin" data-field-text="admin" data-field-label="admin - admin@localhost (admin)" data-icon="/jira/secure/useravatar?size=xsmall&amp;avatarId=10122">admin</option>\n                    <option value="" data-field-text="Unassigned" data-field-label="Unassigned" data-icon="/jira/secure/useravatar?size=xsmall&amp;avatarId=10123">Unassigned</option>\n                    <option value="-1" data-field-text="Automatic" data-field-label="Automatic" data-icon="/jira/secure/useravatar?size=xsmall&amp;avatarId=10123">Automatic</option>\n                </optgroup>\n            </select>').appendTo(fixture);

        var hiddenParams = jQuery('<fieldset class="hidden parameters"></fieldset>');
        jQuery('<input type="hidden" title="projectKeys" value=' + PROJECT_KEY + '>').appendTo(hiddenParams);

        if (setAssigneeEditIssueKey) {
            jQuery('<input type="hidden" title="assigneeEditIssueKey" value=' + ISSUE_KEY + '>').appendTo(hiddenParams);
        }

        hiddenParams.appendTo(fixture);

        return pickerSelect;
    };

    module("JIRA.AssigneePicker", {
        setup: function setup() {
            this.fixture = jQuery("#qunit-fixture");

            this.xhr = sinon.useFakeXMLHttpRequest();
            var requests = this.requests = [];
            this.xhr.onCreate = function (req) {
                requests.push(req);
            };

            var userCounter = 0;
            this.testHelper = {
                responseBuilder: function responseBuilder(numberOfItems) {
                    var output = [];
                    for (var i = 0; i < numberOfItems; i++) {
                        output.push({
                            name: "user" + userCounter,
                            displayName: "User " + userCounter,
                            emailAddress: "user" + userCounter + "@local",
                            avatarUrls: {
                                '16x16': ''
                            }
                        });
                        userCounter++;
                    }

                    return JSON.stringify(output);
                },
                scroll: function scroll($element, scrollPercent) {
                    $element[0].scrollTop = scrollPercent * $element[0].scrollHeight / 100;
                    $element.trigger('scroll');
                },
                respondWith: function respondWith(numberOfItems) {
                    _.last(requests).respond(200, { "Content-Type": "application/json" }, this.responseBuilder(numberOfItems));
                },
                urlFromLastRequest: function urlFromLastRequest() {
                    var request = _.last(requests);
                    return (typeof request === 'undefined' ? 'undefined' : _typeof(request)) === 'object' ? request.url : '';
                },
                parseQueryString: function parseQueryString(queryString) {
                    return _.object(queryString.split('&').map(function (s) {
                        return s.split('=');
                    }));
                },
                paramsFromLastRequest: function paramsFromLastRequest() {
                    return this.parseQueryString(this.urlFromLastRequest().split('?')[1]);
                }
            };
        },

        tearDown: function tearDown() {
            this.fixture.innerHTML = '';
            this.xhr.restore();
            this.requests = [];
        }

    });

    test("Selecting invalid Automatic assignee", function () {
        var pickerSelectElement = createPicker(this.fixture, false);
        var assigneePicker = new AssigneePicker({
            element: pickerSelectElement,
            editValue: "-1"
        });

        ok(!assigneePicker.$container.hasClass("aui-ss-editing"), 'input should not be in edit mode');
        equal(assigneePicker.$field.val(), "Automatic", '"Automatic" assignee should be displayed as string label');
    });

    test("It should fetch the assignee list when the picker is opened", function () {
        var pickerSelectElement = createPicker(this.fixture, false);
        var MAX_RESULTS = 100; // since UCACHE-183 we simplify assignable search
        var assigneePicker = new AssigneePicker({
            element: pickerSelectElement
        });

        sinon.spy(assigneePicker.suggestionsHandler.descriptorFetcher, 'execute');

        assigneePicker._handleCharacterInput.call(assigneePicker, true); // force to show dropdown list
        ok(assigneePicker.suggestionsHandler.descriptorFetcher.execute.calledOnce, 'AJAX called when the picker is opened');
        equal(this.testHelper.paramsFromLastRequest().maxResults, MAX_RESULTS, 'Fetches first items');
        this.testHelper.respondWith(50);

        equal(assigneePicker.listController.getAllItems().length, 53, "Display 53  (3 suggestions + 50 new items)");
    });

    test("It should debounce calls to the server", function () {
        var pickerSelectElement = createPicker(this.fixture, false);
        var assigneePicker = new AssigneePicker({
            element: pickerSelectElement
        });

        var clock = sinon.useFakeTimers();

        assigneePicker.$field.val("a");
        assigneePicker._handleCharacterInput();
        assigneePicker.$field.val("ab");
        assigneePicker._handleCharacterInput();
        assigneePicker.$field.val("abc");
        assigneePicker._handleCharacterInput();
        equal(this.requests.length, 0, "Requests are not made immediately");
        clock.tick(300);
        this.testHelper.respondWith(50);
        equal(this.requests.length, 1, "Server is called once");

        clock.restore();
    });

    var testCases = [{
        description: "call the proper URL when legacy endpoint is used and assigneeEditIssueKey is not present",
        newEndpoint: false,
        hasIssueKey: false,
        expectedUrl: '/rest/api/latest/user/assignable/multiProjectSearch',
        expectedIssueKey: undefined,
        expectedUsernameKey: 'username',
        expectedProjectKeys: PROJECT_KEY
    }, {
        description: "call the proper URL when new endpoint is used and assigneeEditIssueKey is not present",
        newEndpoint: true,
        hasIssueKey: false,
        expectedUrl: '/rest/internal/2/users/assignee/multiProjectSearch',
        expectedIssueKey: undefined,
        expectedUsernameKey: 'query',
        expectedProjectKeys: PROJECT_KEY
    }, {
        description: "call the proper URL when legacy endpoint is used and assigneeEditIssueKey is present",
        newEndpoint: false,
        hasIssueKey: true,
        expectedUrl: '/rest/api/latest/user/assignable/search',
        expectedIssueKey: ISSUE_KEY,
        expectedUsernameKey: 'username',
        expectedProjectKeys: PROJECT_KEY
    }, {
        description: "call the proper URL when new endpoint is used and assigneeEditIssueKey is present",
        newEndpoint: true,
        hasIssueKey: true,
        expectedUrl: '/rest/internal/2/users/assignee',
        expectedIssueKey: ISSUE_KEY,
        expectedUsernameKey: 'query',
        expectedProjectKeys: undefined
    }];

    testCases.forEach(function (testCase) {
        test('' + testCase.description, function () {
            var pickerSelectElement = createPicker(this.fixture, testCase.newEndpoint, testCase.hasIssueKey);
            var searchValue = 'abc';
            var assigneePicker = new AssigneePicker({
                element: pickerSelectElement
            });

            var clock = sinon.useFakeTimers();

            assigneePicker.$field.val(searchValue);
            assigneePicker._handleCharacterInput();
            clock.tick(300);

            ok(this.testHelper.urlFromLastRequest().includes(testCase.expectedUrl), "Uses the proper URL");
            equal(this.testHelper.paramsFromLastRequest().issueKey, testCase.expectedIssueKey, 'issueKey param is set correctly');
            equal(this.testHelper.paramsFromLastRequest()[testCase.expectedUsernameKey], searchValue, testCase.expectedUsernameKey + ' param is set');
            equal(this.testHelper.paramsFromLastRequest().projectKeys, testCase.expectedProjectKeys, 'projectKeys param is set correctly');

            clock.restore();
            this.fixture.innerHTML = '';
            this.fixture = jQuery("#qunit-fixture");
        });
    });

    test("It should NOT send request to server when user keeps clicking on the field", function () {
        var pickerSelectElement = createPicker(this.fixture, false);
        var assigneePicker = new AssigneePicker({
            element: pickerSelectElement
        });

        var $assigneeField = assigneePicker.$container.find("#assignee-field");

        sinon.spy(assigneePicker.suggestionsHandler.descriptorFetcher, 'execute');
        stop();
        _.delay(function () {
            // delay is necessary here because the field events is bind in setTimeout
            $assigneeField.click();
            this.testHelper.respondWith(50);
            ok(assigneePicker.suggestionsHandler.descriptorFetcher.execute.calledOnce, 'Click on assignee field for the 1st time, request was sent to retrieve data');

            $assigneeField.click();
            ok(assigneePicker.suggestionsHandler.descriptorFetcher.execute.calledOnce, 'Click on assignee field for the 2nd time, NO request was sent');

            $assigneeField.click();
            ok(assigneePicker.suggestionsHandler.descriptorFetcher.execute.calledOnce, 'Click on assignee field for the 3rd time, NO request was sent');

            start();
        }.bind(this), 100);
    });

    // UCACHE-178
    test("It should NOT deduplicate results", function () {
        var pickerSelectElement = createPicker(this.fixture, false);
        var assigneePicker = new AssigneePicker({
            element: pickerSelectElement
        });

        notOk(assigneePicker.options.removeDuplicates, "Assignee picker does not deduplicate the results");
        ok(assigneePicker.options.disableRemoveSelected, "Assignee picker does not remove selected options from results");
    });
});
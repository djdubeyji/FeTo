AJS.test.require("jira.webresources:navigation-utils", function () {
    'use strict';

    require(["jira/util/navigation", "jira/backbone-1.3.3"], function (Navigation, Backbone) {
        module('NavigationUtils', {
            setup: function setup() {
                Navigation.pushStateSupported = true;
            }
        });

        test('should return value of parameter', function () {
            var location = '?param1=test&param2=45';

            equal(Navigation.getParam("param1", false, location), "test");
            equal(Navigation.getParam("param2", false, location), "45");
        });

        test('should return undefined if there is no parameter', function () {
            var location = '';

            strictEqual(Navigation.getParam("param1", false, location), undefined);

            location = '../../../';
            strictEqual(Navigation.getParam("param2", false, location), undefined);
        });

        test('should return parameter value from hash if told to do so', function () {
            var location = '?param1=test&param2=34&param3=asd#param2=45';

            equal(Navigation.getParam("param1", true, location), "test");
            equal(Navigation.getParam("param2", false, location), "34");
            equal(Navigation.getParam("param2", true, location), "45");
        });

        test('should return last value of parameter', function () {
            var location = '?param1=value1&param1=value2#param1=hash';

            equal(Navigation.getParam("param1", false, location), "value2");
            equal(Navigation.getParam("param1", true, location), "hash");
        });

        test("should decode encoded params", function () {
            var location = "?param=%3Cvalue%3E&param2=some%20text&param3=%3Csome%20value%3E";

            equal(Navigation.getParam("param", false, location), "<value>", "Should URI-decode the value.");
            equal(Navigation.getParam("param2", false, location), "some text", "Should change + to spaces.");
            equal(Navigation.getParam("param3", false, location), "<some value>", "Should URI-decode the value and change + to space.");
        });

        test('should build proper query from passed parameters', function () {
            var params = {
                "param1": "value1",
                "param2": 45,
                "param3": false
            };
            var location = "?param1=value1&param2=45";

            equal(Navigation.buildQuery(params), location);
        });

        test('should encode parameters in built query', function () {
            var params = {
                "param1": "\"<test param>\"",
                "param2": "param3=value3&param4=value"
            };
            var location = "?param1=%22%3Ctest+param%3E%22&param2=param3%3Dvalue3%26param4%3Dvalue";

            console.log(Navigation.buildQuery(params));
            equal(Navigation.buildQuery(params), location);
        });

        test('should build proper query depending on push state support', function () {
            var params = {
                "param1": "value1",
                "param2": "value2"
            };

            equal(Navigation.buildQuery(params), "?param1=value1&param2=value2");
            Navigation.pushStateSupported = false;
            equal(Navigation.buildQuery(params), "param1=value1&param2=value2");
        });

        test('should navigate to proper urls based on push state support', function () {
            Backbone.history.navigate = sinon.spy();

            var query = '?param1=value1&param2=value2#param3';
            Navigation.navigate(query);
            ok(Backbone.history.navigate.calledWith(window.location.pathname + query));

            Navigation.pushStateSupported = false;
            Navigation.navigate(query);
            ok(Backbone.history.navigate.calledWith(query));
        });

        test('should build query from parameters if object is passed', function () {
            Backbone.history.navigate = sinon.spy();
            var params = {
                param1: "value1",
                param2: "value2",
                param3: false
            };
            var query = "?param1=value1&param2=value2";

            Navigation.navigate(params);
            ok(Backbone.history.navigate.calledWith(window.location.pathname + query));
        });
    });
});
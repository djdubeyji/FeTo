AJS.test.require(["jira.webresources:jira-fields", "jira.webresources:jira-global", "jira.webresources:status-category-picker"], function () {
    'use strict';

    var statusCategorySingleSelect = require('jira/field/status-category-single-select');

    module("JIRA.StatusCategorySingleSelect", {
        setup: function setup() {
            this.sandbox = sinon.sandbox.create();
        },
        teardown: function teardown() {
            this.sandbox.restore();
        }
    });

    test("Is correctly declared in AMD", function () {
        ok(statusCategorySingleSelect, "Is AMDifyed");
    });
});
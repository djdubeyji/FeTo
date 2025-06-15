AJS.test.require('jira.webresources:jira-global', function () {
    'use strict';

    var $ = require('jquery');

    var fixture = null;

    module("jira/issuetable", {
        setup: function setup() {
            $("#qunit-fixture").html('');
            fixture = $("#qunit-fixture");
        },
        teardown: function teardown() {}
    });

    test("Drag and drop script is loaded if there is a subtasks table", function (assert) {
        var issueTable = require('jira/issuetable');

        assert.expect(1);
        var done = assert.async();
        $("<issuetable-web-component data-content='subtasks'><table id='issuetable'></table></issuetable-web-component>").appendTo(fixture);

        return issueTable.then(function (api) {
            assert.ok(api);
            done();
        });
    });
});
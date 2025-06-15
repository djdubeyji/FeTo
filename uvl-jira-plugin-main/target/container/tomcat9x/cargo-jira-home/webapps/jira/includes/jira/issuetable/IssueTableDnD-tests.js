AJS.test.require('jira.webresources:jira-global', function () {
    'use strict';

    var $ = require('jquery');
    var issueTable = require('jira/issuetable');

    var fixture = null;
    var issueTableApi = null;

    module("jira/issuetable", {
        setup: function setup() {
            if (issueTableApi) {
                issueTableApi.tables = [];
                issueTableApi.off(issueTableApi.Events.ATTACHED);
            }
            $("#qunit-fixture").html('');
            fixture = $("#qunit-fixture");
        },
        teardown: function teardown() {}
    });

    test("Listeners are notified on component appearance on a page", function (assert) {
        assert.expect(1);
        var done = assert.async();

        issueTable.then(function (api) {
            issueTableApi = api;
            issueTableApi.onTable(function (table) {
                assert.ok(table, 'Listeners should receive tables');
                api.off(api.Events.ATTACHED);
                done();
            });
        });

        $("<issuetable-web-component data-content='subtasks'><table id='issuetable'></table></issuetable-web-component>").appendTo(fixture);
    });

    test("Listeners are notified even if component already present on a page", function (assert) {
        assert.expect(1);
        var done = assert.async();

        $("<issuetable-web-component data-content='subtasks'><table id='issuetable'></table></issuetable-web-component>").appendTo(fixture);

        issueTableApi.onTable(function (table) {
            assert.ok(table, 'Listeners should receive tables');
            done();
        });
    });

    test("Listeners are notified for every table separately", function (assert) {
        var notified = 0;

        var amount = 3;
        var total = amount * 2;

        assert.expect(total);

        var done = [];

        for (var i = 0; i < total; i++) {
            done.push(assert.async());
        }

        for (var _i = 0; _i < amount; _i++) {
            $("<issuetable-web-component data-content='subtasks'><table id='issuetable1" + _i + "'></table></issuetable-web-component>").appendTo(fixture);
        }

        issueTableApi.onTable(function (table) {
            assert.ok(table, 'Listeners must be supplied with table whenever it appears on a page');
            done[notified]();
            notified++;
        });

        for (var _i2 = 0; _i2 < amount; _i2++) {
            $("<issuetable-web-component data-content='subtasks'><table id='issuetable2" + _i2 + "'></table></issuetable-web-component>").appendTo(fixture);
        }
    });

    test("Every table must be capable of dragging by default", function (assert) {
        assert.expect(4);
        var done = assert.async();

        issueTableApi.onTable(function (table) {
            assert.ok(table.dragging, 'Failed to detect dragging enabled');
            assert.ok(table.dragging.enable, 'Failed to detect dragging enabled');
            assert.ok(table.dragging.disable, 'Failed to detect dragging enabled');
            assert.ok(table.dragging.cancel, 'Failed to detect dragging enabled');
            done();
        });

        $("<issuetable-web-component data-content='subtasks'><table id='issuetable'></table></issuetable-web-component>").appendTo(fixture);
    });
});
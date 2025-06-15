AJS.test.require(["jira.webresources:viewcustomfields"], function () {
    "use strict";

    var CustomfieldsPaginationDetailsView = require("jira/customfields/customfieldsPaginationDetailsView");

    module("CustomfieldsPaginationDetailsView");

    test("Displays correct pagination details", function () {
        var view = new CustomfieldsPaginationDetailsView();

        equal(view.getStart(1, 50, 51), 1, "displays correct start for small dataset");
        equal(view.getStart(2, 50, 51), 51, "displays correct start for large dataset");
        equal(view.getStart(1, 50, 0), 0, "displays correct start for empty dataset");

        equal(view.getEnd(1, 50, 51), 50, "displays correct end for small dataset");
        equal(view.getEnd(2, 50, 51), 51, "displays correct end for large dataset");
        equal(view.getEnd(1, 50, 0), 0, "displays correct end for empty dataset");
    });

    test("Shows and hides pagination details if not available", function () {
        var view = new CustomfieldsPaginationDetailsView();

        ok(view.template({
            start: 1,
            end: 1,
            total: 1
        }).includes("admin.issuefields.customfields.pagination.details"), "Displays copy if results are available");
        notOk(view.template({
            start: 0,
            end: 0,
            total: 0
        }).includes("admin.issuefields.customfields.pagination.details"), "Hides copy if results are not available");
    });
});
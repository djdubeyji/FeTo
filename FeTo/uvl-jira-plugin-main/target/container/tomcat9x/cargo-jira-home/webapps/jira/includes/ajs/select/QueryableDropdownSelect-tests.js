AJS.test.require(["jira.webresources:select-pickers"], function () {
    "use strict";

    var jQuery = require("jquery");
    var Deferred = require("jira/jquery/deferred");
    var QueryableDropdownSelect = require("jira/ajs/select/queryable-dropdown-select");

    module("QueryableDropdownSelect");

    function checkAttributeAssertions(queryableDropdownSelect, assertions) {
        assertions.forEach(function (_ref) {
            var attr = _ref.attr,
                value = _ref.value;

            equal(queryableDropdownSelect.$field.attr(attr), value, "expected " + attr + "=" + value);
        });
    }

    test("Should get results before rendering dropdown (such that positioning won't be borked)", function () {
        var sandbox = this;
        var qdds = new QueryableDropdownSelect({
            element: jQuery("<ul></ul>")
        });

        sandbox.stub(qdds, "getQueryVal", function () {
            return "one";
        });
        sandbox.stub(qdds, 'requestSuggestions', function () {
            return new Deferred().resolve(["one", "two"]).promise();
        });

        var genList = sandbox.spy(qdds.listController, "generateListFromJSON");
        var showDropdown = sandbox.spy(qdds.dropdownController, "show");
        var positionDropdown = sandbox.spy(qdds.dropdownController, "setPosition");

        qdds.onEdit();

        ok(genList.calledBefore(showDropdown), "should have results before we render a dropdown with them in it (to prevent things like TF-39)");
        ok(genList.calledBefore(positionDropdown), "should have results before we calc and position a dropdown with them in it (to prevent things like TF-39)");
    });

    test("ariaLabel", function () {
        var qdds = new QueryableDropdownSelect({
            element: jQuery("<ul></ul>"),
            ariaLabel: "Test Label"
        });

        equal(qdds.$field.attr("aria-label"), "Test Label", "aria-label attribute should be set from options");
    });

    test("the dropdown trigger should have correct attributes", function () {
        var qdds = new QueryableDropdownSelect({
            element: jQuery("<ul></ul>"),
            ariaLabel: "Test Label"
        });

        equal(qdds.$dropDownIcon.attr('tabindex'), "-1", "Dropdown should have tabindex set to -1");
    });

    test("verify combobox attributes (compat with Aria 1.0 and 1.2)", function () {
        var qdds = new QueryableDropdownSelect({
            element: jQuery("<ul></ul>")
        });

        var assertions = [{
            attr: 'role', value: 'combobox'
        }, {
            attr: 'autocomplete', value: 'off'
        }, {
            attr: 'aria-autocomplete', value: 'list'
        }, {
            attr: 'aria-expanded', value: 'false'
        }, {
            // it's expected to use an implicit aria-haspopup value for the combobox role
            attr: 'aria-haspopup', value: undefined
        }];
        checkAttributeAssertions(qdds, assertions);
    });

    test("verify combobox attributes when expanded (compat with Aria 1.0 and 1.2)", function (assert) {
        var done = assert.async();

        var qdds = new QueryableDropdownSelect({
            element: jQuery("<ul></ul>"),
            id: 'uniqueId'
        });
        var suggestionsId = 'uniqueId-suggestions';
        var selectedItemId = 'null';

        qdds.showSuggestions();
        // only for checking aria-activedescendant
        qdds.listController.focus(); // or qdds._onItemFocus({}, {id: selectedItemId})

        var assertions = [{
            // compat with Aria 1.2
            attr: 'aria-controls', value: suggestionsId
        }, {
            // compat with Aria 1.0 (should be removed when all SPLAT support Aria 1.2+
            attr: 'aria-owns', value: suggestionsId
        }, {
            attr: 'aria-expanded', value: 'true'
        }, {
            attr: 'aria-activedescendant', value: selectedItemId
        }];

        // need to wait for assistive.js#ASSISTIVE_TIMEOUT (for aria-activedescendant only)
        setTimeout(function () {
            checkAttributeAssertions(qdds, assertions);
            done();
        }, 100);
    });

    test("verify combobox attributes when collapsed (compat with Aria 1.0 and 1.2)", function () {
        var qdds = new QueryableDropdownSelect({
            element: jQuery("<ul></ul>")
        });
        qdds.showSuggestions();
        qdds.hideSuggestions();

        var assertions = [{
            // compat with Aria 1.2
            attr: 'aria-controls', value: undefined
        }, {
            // compat with Aria 1.0 (should be removed when all SPLAT support Aria 1.2+
            attr: 'aria-owns', value: undefined
        }, {
            attr: 'aria-expanded', value: 'false'
        }, {
            attr: 'aria-activedescendant', value: undefined
        }];

        checkAttributeAssertions(qdds, assertions);
    });
});
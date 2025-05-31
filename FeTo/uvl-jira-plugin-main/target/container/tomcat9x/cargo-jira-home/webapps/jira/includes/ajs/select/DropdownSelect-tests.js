AJS.test.require(["jira.webresources:dropdown-select"], function () {
    "use strict";

    var DropdownSelect = require('jira/ajs/select/dropdown-select');
    var inlineLayerOptions = { testProperty: true };

    module("DropdownSelect", {
        setup: function setup() {
            this.dropdownSelect = new DropdownSelect({}, inlineLayerOptions);
        }
    });

    test("check if inlineLayerOptions has been passed through to dropdownController", function () {
        ok(this.dropdownSelect.dropdownController.options.properties.hasOwnProperty(Object.keys(inlineLayerOptions)[0]), 'dropdownController contains additional options from inlineLayerOptions');
    });
});
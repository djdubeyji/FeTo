AJS.test.require(["jira.webresources:select-pickers"], function () {
    "use strict";

    var jQuery = require("jquery");
    var MultiSelect = require("jira/ajs/select/multi-select");

    module("MultiSelect", {
        setup: function setup() {
            var selectHtml = "<select id=\"drinks\" multiple=\"multiple\">\n" + "<optgroup label=\"Beers\">\n" + "<option value=\"1\">Victoria Bitter</option>\n" + "<option value=\"2\">Blue tongue</option>\n" + "<option value=\"3\">James Squires</option>\n" + "</optgroup>\n" + "<optgroup label=\"Wines\">\n" + "<option value=\"4\">Jacobs Creek</option>\n" + "<option value=\"5\">Oyster Bay</option>\n" + "</optgroup>\n" + "</select>";
            this.$select = jQuery(selectHtml).appendTo("#qunit-fixture");
        },
        teardown: function teardown() {
            this.$select.remove();
        }
    });

    test("should check if indentation needs to be set on focus", function (assert) {
        var done = assert.async();
        var fixture = document.getElementById('qunit-fixture');
        fixture.style.display = 'none';

        var multiSelect = createMultiSelect();

        multiSelect._probablyNeedsIndentationSet = sinon.stub().returns(true);
        addItem(multiSelect);

        fixture.style.display = 'block';

        setTimeout(function () {
            document.getElementById('drinks-textarea').focus();
            sinon.assert.callCount(multiSelect._probablyNeedsIndentationSet, 1);
            done();
        }, 100);
    });

    test("proper value indentation value should be computed on focus", function (assert) {
        var done = assert.async();
        var fixture = document.getElementById('qunit-fixture');
        var initialPaddingLeft = 4;

        fixture.style.display = 'none';

        var multiSelect = createMultiSelect();
        addItem(multiSelect);

        fixture.style.display = 'block';

        var selectTextarea = document.getElementById('drinks-textarea');

        equal(parseInt(selectTextarea.style.paddingLeft), initialPaddingLeft);

        setTimeout(function () {
            selectTextarea.focus();
            var lozenge = document.getElementById('item-row-1');
            var expectedPaddingLeft = lozenge.offsetLeft + lozenge.offsetWidth + 8;

            equal(parseInt(selectTextarea.style.paddingLeft), expectedPaddingLeft);
            done();
        }, 100);
    });

    function createMultiSelect() {
        return new MultiSelect({
            element: jQuery("#drinks"),
            itemAttrDisplayed: "label"
        });
    }

    function addItem(multiSelect) {
        multiSelect.addItem({
            properties: {
                fallbackIcon: "none",
                icon: "none",
                invalid: false,
                label: "Victoria Bitter",
                removeOnUnSelect: false,
                selected: true,
                showLabel: true,
                styleClass: "",
                title: "Victoria Bitter",
                value: "1"
            }
        }, true);
    }
});
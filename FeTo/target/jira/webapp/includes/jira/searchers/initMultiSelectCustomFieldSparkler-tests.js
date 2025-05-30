AJS.test.require(['jira.webresources:searchers'], function () {
    'use strict';

    var _this = this;

    var pickersUtils = {
        getSelectedProjectsIds: function getSelectedProjectsIds() {
            return ['1423'];
        },
        getSelectedIssueTypeIds: function getSelectedIssueTypeIds() {
            return ['123', '444'];
        }
    };

    module('multiSelectCustomFieldSparkler', {
        setup: function setup() {
            _this.sandbox = sinon.sandbox.create();
            _this.context = AJS.test.mockableModuleContext();

            _this.skateSpy = _this.sandbox.spy();
            _this.skateSpy.type = {};

            _this.mockedMultiSelectPickerFinalOptions = {
                ajaxOptions: 47
            };
            _this.multiSelectPickerOptionsSpy = _this.sandbox.spy(function () {
                return _this.mockedMultiSelectPickerFinalOptions;
            });
            _this.checkboxMultiSelectSpy = _this.sandbox.spy();

            _this.context.mock('jira/skate', _this.skateSpy);
            _this.context.mock('jira/searchers/element/multi-select-custom-field-picker-options', _this.multiSelectPickerOptionsSpy);
            _this.context.mock('jira/ajs/select/checkbox-multi-select', _this.checkboxMultiSelectSpy);
            _this.context.mock('jira/searchers/element/common-pickers-utils', pickersUtils);
            _this.context.require('jira/searchers/element/multi-select-custom-field-sparkler');

            _this.fixture = document.getElementById('qunit-fixture');
            _this.fixture.innerHTML = '\n                <select class="select js-default-checkboxmultiselect-custom-field" \n                    id="searcher-customfield_10201" \n                    multiple="multiple" \n                    name="customfield_10201" \n                    data-custom-field-id="10201"\n                    data-max-inline-results-displayed="100"\n                >\n                    <option title="Option 0" value="10116">\n                        Option 0\n                    </option>\n                    <option title="Option 1" value="10118">\n                        Option 1\n                    </option>\n                </select>';
        },
        teardown: function teardown() {
            _this.sandbox.restore();
        }
    });

    test('should setup multiselect custom field picker', function () {
        // given
        equal(_this.skateSpy.calledOnce, true, 'skate was called');
        var callArgs = _this.skateSpy.args[0];
        equal(callArgs[0], 'js-default-checkboxmultiselect-custom-field', 'Class name defining picker is correct');
        var element = document.getElementById('searcher-customfield_10201');

        // when
        var setupOptions = callArgs[1];
        setupOptions.created(element);

        // then
        equal(_this.multiSelectPickerOptionsSpy.calledOnce, true, 'multiSelectCustomFieldPickerOptions was called');

        var initOptions = _this.multiSelectPickerOptionsSpy.firstCall.args[0];
        equal(initOptions.content, 'mixed', 'Mixed descriptor fetcher is set');

        var expectedBaseAjaxOptions = {
            customFieldId: 10201,
            projectIds: pickersUtils.getSelectedProjectsIds(),
            issueTypeIds: pickersUtils.getSelectedIssueTypeIds()
        };
        deepEqual(initOptions.baseAjaxOptions, expectedBaseAjaxOptions, 'Base Ajax options are correctly set');

        equal(_this.checkboxMultiSelectSpy.calledOnce, true, 'New CheckboxMultiSelect was created');
        equal(_this.checkboxMultiSelectSpy.calledWith(_this.mockedMultiSelectPickerFinalOptions), true, 'CheckboxMultiSelect is passed final multi select picker options');
    });
});
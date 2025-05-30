AJS.test.require(['jira.webresources:searchers'], function () {
    'use strict';

    var _this = this;

    var pickerOptions = {
        DEFAULT_MAX_RESULTS: 4,
        DEFAULT_MAX_RESULTS_PER_GROUP: 2
    };

    module('projectSparkler', {
        setup: function setup() {
            _this.sandbox = sinon.sandbox.create();
            _this.context = AJS.test.mockableModuleContext();

            _this.skateSpy = _this.sandbox.spy();
            _this.skateSpy.type = {};
            _this.mockedProjectPickerFinalOptions = {
                ajaxOptions: 42
            };
            _this.projectPickerOptionsSpy = _this.sandbox.spy(function () {
                return _this.mockedProjectPickerFinalOptions;
            });
            _this.checkboxMultiSelectSpy = _this.sandbox.spy();

            _this.context.mock('jira/skate', _this.skateSpy);
            _this.context.mock('jira/searchers/element/project-picker-options', _this.projectPickerOptionsSpy);
            _this.context.mock('jira/ajs/select/checkbox-multi-select', _this.checkboxMultiSelectSpy);
            _this.context.mock('jira/searchers/element/common-pickers-utils', pickerOptions);
            _this.context.require('jira/searchers/element/project-sparkler');

            _this.fixture = document.getElementById('qunit-fixture');
            _this.fixture.innerHTML = '<select class="select js-default-checkboxmultiselect-custom-field" id="searcher-pid" multiple="multiple" name="pid">\n                <option title="Project Z" value="26">\n                    Project Z\n                </option>\n                <option title="Project X" value="10">\n                    Project X\n                </option>\n            </select>';
        },
        teardown: function teardown() {
            _this.sandbox.restore();
        }
    });

    test('should setup project picker', function () {
        // given
        equal(_this.skateSpy.calledOnce, true, 'skate was called');
        var callArgs = _this.skateSpy.args[0];
        equal(callArgs[0], 'js-project-checkboxmultiselect', 'Class name defining picker is correct');
        var element = document.getElementById('searcher-pid');

        // when
        var setupOptions = callArgs[1];
        setupOptions.created(element);

        // then
        equal(_this.projectPickerOptionsSpy.calledOnce, true, 'projectPickerOptions() was called');

        var initOptions = _this.projectPickerOptionsSpy.firstCall.args[0];
        equal(initOptions.content, 'mixed', 'Mixed descriptor fetcher is set');

        equal(_this.checkboxMultiSelectSpy.calledOnce, true, 'New CheckboxMultiSelect was created');
        equal(_this.checkboxMultiSelectSpy.calledWith(_this.mockedProjectPickerFinalOptions), true, 'CheckboxMultiSelect is passed final project picker options');
    });
});
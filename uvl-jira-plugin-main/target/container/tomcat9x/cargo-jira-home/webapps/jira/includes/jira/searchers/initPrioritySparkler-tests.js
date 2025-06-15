AJS.test.require(['jira.webresources:searchers'], function () {
    'use strict';

    var _this = this;

    var pickerOptions = {
        getSelectedProjectsIds: function getSelectedProjectsIds() {
            return ['16'];
        }
    };

    module('prioritySparkler', {
        setup: function setup() {
            _this.sandbox = sinon.sandbox.create();
            _this.context = AJS.test.mockableModuleContext();

            _this.skateSpy = _this.sandbox.spy();
            _this.skateSpy.type = {};
            _this.mockedPriorityPickerFinalOptions = {
                ajaxOptions: 11
            };
            _this.priorityPickerOptionsSpy = _this.sandbox.spy(function () {
                return _this.mockedPriorityPickerFinalOptions;
            });
            _this.checkboxMultiSelectSpy = _this.sandbox.spy();

            _this.context.mock('jira/skate', _this.skateSpy);
            _this.context.mock('jira/searchers/element/priority-picker-options', _this.priorityPickerOptionsSpy);
            _this.context.mock('jira/ajs/select/checkbox-multi-select', _this.checkboxMultiSelectSpy);
            _this.context.mock('jira/searchers/element/common-pickers-utils', pickerOptions);
            _this.context.require('jira/searchers/element/priority-sparkler');

            _this.fixture = document.getElementById('qunit-fixture');
            _this.fixture.innerHTML = '<select class="select js-default-checkboxmultiselectpriority" id="searcher-priority" multiple="multiple" name="priority">\n                <option title="Priority Low" value="1">\n                    Priority Low\n                </option>\n                <option title="Priority High" value="2">\n                    Priority High\n                </option>\n            </select>';
        },
        teardown: function teardown() {
            _this.sandbox.restore();
        }
    });

    test('should setup priority picker', function () {
        // given
        equal(_this.skateSpy.calledOnce, true, 'skate was called');
        var callArgs = _this.skateSpy.args[0];
        equal(callArgs[0], 'js-default-checkboxmultiselectpriority', 'Class name defining picker is correct');
        var element = document.getElementById('searcher-pid');

        // when
        var setupOptions = callArgs[1];
        setupOptions.created(element);

        // then
        equal(_this.priorityPickerOptionsSpy.calledOnce, true, 'priorityPickerOptions() was called');

        var initOptions = _this.priorityPickerOptionsSpy.firstCall.args[0];
        equal(initOptions.content, 'mixed', 'Mixed descriptor fetcher is set');

        var expectedBaseAjaxOptions = {
            projectIds: pickerOptions.getSelectedProjectsIds()
        };
        deepEqual(initOptions.baseAjaxOptions, expectedBaseAjaxOptions, 'Base Ajax options are correctly set');

        equal(_this.checkboxMultiSelectSpy.calledOnce, true, 'New CheckboxMultiSelect was created');
        equal(_this.checkboxMultiSelectSpy.calledWith(_this.mockedPriorityPickerFinalOptions), true, 'CheckboxMultiSelect was passed final project picker options');
    });
});
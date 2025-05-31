AJS.test.require(['jira.webresources:searchers'], function () {
    'use strict';

    var _this = this;

    var pickerOptions = {
        getSelectedProjectsIds: function getSelectedProjectsIds() {
            return ['11', '13'];
        },
        getSelectedIssueTypeIds: function getSelectedIssueTypeIds() {
            return ['123', '4321'];
        }
    };

    module('statusSparkler', {
        setup: function setup() {
            _this.sandbox = sinon.sandbox.create();
            _this.context = AJS.test.mockableModuleContext();

            _this.skateSpy = _this.sandbox.spy();
            _this.skateSpy.type = {};
            _this.mockedStatusPickerFinalOptions = {
                ajaxOptions: 42
            };
            _this.statusPickerOptionsSpy = _this.sandbox.spy(function () {
                return _this.mockedStatusPickerFinalOptions;
            });
            _this.checkboxMultiSelectStatusSpy = _this.sandbox.spy();

            _this.context.mock('jira/skate', _this.skateSpy);
            _this.context.mock('jira/searchers/element/status-picker-options', _this.statusPickerOptionsSpy);
            _this.context.mock('jira/ajs/select/checkbox-multi-select-status-lozenge', _this.checkboxMultiSelectStatusSpy);
            _this.context.mock('jira/searchers/element/common-pickers-utils', pickerOptions);
            _this.context.require('jira/searchers/element/status-lozenge-sparkler');

            _this.fixture = document.getElementById('qunit-fixture');
            _this.fixture.innerHTML = '<select class="select js-default-checkboxmultiselectstatuslozenge" id="searcher-status" multiple="multiple" name="status">\n                <option title="Done" value="1">\n                    Done\n                </option>\n                <option title="In Progress" value="2">\n                    In progress\n                </option>\n            </select>';
        },
        teardown: function teardown() {
            _this.sandbox.restore();
        }
    });

    test('should setup status picker', function () {
        // given
        equal(_this.skateSpy.calledOnce, true, 'skate was called');
        var callArgs = _this.skateSpy.args[0];
        equal(callArgs[0], 'js-default-checkboxmultiselectstatuslozenge', 'Class name defining picker is correct');
        var element = document.getElementById('searcher-status');

        // when
        var setupOptions = callArgs[1];
        setupOptions.created(element);

        // then
        equal(_this.statusPickerOptionsSpy.calledOnce, true, 'statusPickerOptions() was called');

        var initOptions = _this.statusPickerOptionsSpy.firstCall.args[0];
        equal(initOptions.content, 'mixed', 'Mixed descriptor fetcher is set');

        var expectedBaseAjaxOptions = {
            projectIds: pickerOptions.getSelectedProjectsIds(),
            issueTypeIds: pickerOptions.getSelectedIssueTypeIds()
        };
        deepEqual(initOptions.baseAjaxOptions, expectedBaseAjaxOptions, 'Base Ajax options are correctly set');

        equal(_this.checkboxMultiSelectStatusSpy.calledOnce, true, 'New CheckboxMultiSelectStatusLozenge was created');
        equal(_this.checkboxMultiSelectStatusSpy.calledWith(_this.mockedStatusPickerFinalOptions), true, 'CheckboxMultiSelectStatusLozenge is passed final project picker options');
    });
});
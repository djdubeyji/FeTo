AJS.test.require(['jira.webresources:user-pickers'], function () {
    'use strict';

    var $ = require('jquery');
    module('initMultiUserPickers', {
        setup: function setup() {
            this.sandbox = sinon.sandbox.create();
            this.context = AJS.test.mockableModuleContext();
            $('#qunit-fixture').html('<section id=\'container\'></section>');
            this.$container = $('#container');

            this.MultiSelect = this.sandbox.spy();
            this.context.mock('jira/ajs/select/multi-select', this.MultiSelect);

            this.NoBrowseUserNamePicker = this.sandbox.spy();
            this.context.mock('jira/field/no-browser-user-name-picker', this.NoBrowseUserNamePicker);

            this.userPopUp = {
                createUserPickerPopupTrigger: this.sandbox.spy()
            };
            this.context.mock('jira/field/create-user-picker-popup-trigger', this.userPopUp);

            this.initMultiUserPickers = this.context.require('jira/field/init-multi-user-pickers');
        },
        teardown: function teardown() {
            this.sandbox.restore();
        }
    });

    test('Creates multi user pickers', function () {
        this.$container.append('\n                <select id=\'test-1\' class=\'js-default-multi-user-picker\' data-user-picker-enabled=\'true\'></select>\n        ');
        this.$container.append('\n                <select id=\'test-2\' class=\'js-default-multi-user-picker\' data-user-picker-enabled=\'true\'></select>\n        ');
        this.$container.append('<select class=\'js-default-multi-user-picker\'></select>');

        this.initMultiUserPickers(this.$container);

        sinon.assert.calledTwice(this.MultiSelect);
    });

    test('Attaches event to pop-up icon', function () {
        this.$container.append('\n           <div id=\'test-1_container\'>\n                <select \n                    id=\'test-1\' \n                    class=\'js-default-multi-user-picker\'\n                    data-user-picker-enabled=\'true\'\n                    data-form-name=\'form-name\'\n                    data-field-name=\'field-name\'\n                    data-multi-select=\'true\'\n                    data-field-config-id=\'field-config-id\'\n                    data-action-to-open=\'test-action1\'\n                ></select>\n                <a href=\'#\' class=\'popup-trigger\'>test1</a>\n            </div>\n        ');
        this.$container.append('\n           <form action=\'#\' name=\'test-form\'>\n               <div id=\'test-2_container\'>\n                    <select \n                        id=\'test-2\' \n                        class=\'js-default-multi-user-picker\'\n                        data-user-picker-enabled=\'true\'\n                        data-form-name=\'form-name\'\n                        data-field-name=\'field-name\'\n                        data-multi-select=\'true\'\n                        data-field-config-id=\'field-config-id\'\n                        data-project-id=\'1000,1001,\'\n                        data-action-to-open=\'test-action\'></select>\n                    <a href=\'#\' class=\'popup-trigger\'>test1</a>\n                </div>\n            </form>\n        ');

        this.initMultiUserPickers(this.$container);

        this.$container.find('.popup-trigger').eq(0).trigger('click');
        var firstCallParams = this.userPopUp.createUserPickerPopupTrigger.getCall(0).args[0];

        equal(firstCallParams.formName, 'form-name', 'Supplies correct form name');
        equal(firstCallParams.fieldConfigId, 'field-config-id', 'Supplies correct field config id');
        equal(firstCallParams.projectIds, undefined, 'Supplies correct project ids');
        equal(firstCallParams.triggerEvent, 'userpicker:onPopUpSelection', 'Supplies correct event name');

        this.$container.find('.popup-trigger').eq(1).trigger('click');
        var secondCallParams = this.userPopUp.createUserPickerPopupTrigger.getCall(1).args[0];

        equal(secondCallParams.formName, 'form-name', 'Supplies correct form name when inside form');
        deepEqual(secondCallParams.projectIds, ['1000', '1001'], 'Supplies correct multiple project ids');
    });

    test('Uses fallback in case of no BROWSE_USERS permission', function () {
        this.$container.append('\n                \n                    data-user-picker-enabled=\'false\'>\n                \n                <select id=\'test-1\' class=\'js-default-multi-user-picker\'></select>\n        ');
        this.initMultiUserPickers(this.$container);
        sinon.assert.calledOnce(this.NoBrowseUserNamePicker, 'Uses fallback input');
    });

    test('Supports custom options for custom fields AJAX call', function () {
        this.$container.append('\n                <select id=\'test-1\' \n                        class=\'js-default-multi-user-picker\'\n                        data-user-picker-enabled=\'true\'\n                        data-field-name=\'field_1002\'\n                        data-field-config-id=\'config_1001\'\n                        data-project-id=\'1000\'></select>\n        ');
        this.$container.append('\n                <select \n                    id=\'test-2\' \n                    class=\'js-default-multi-user-picker\'\n                    data-user-picker-enabled=\'true\'\n                    data-project-id=\'1000,1001\'>\n                    <option selected>Jane Doe</option>\n                </select>\n        ');
        this.initMultiUserPickers(this.$container);

        var firstCallParams = this.MultiSelect.getCall(0).args[0].ajaxOptions.data();

        equal(firstCallParams.fieldConfigId, 'config_1001', 'Passes field config id');
        equal(firstCallParams.fieldName, 'field_1002', 'Passes field name');
        deepEqual(firstCallParams.projectId, ['1000'], 'Passes project id');
        equal(firstCallParams.query, undefined, 'Uses debouncing');

        var secondCallParams = this.MultiSelect.getCall(1).args[0].ajaxOptions.data();

        deepEqual(secondCallParams.projectId, ['1000', '1001'], 'Sends correct project id');
        deepEqual(secondCallParams.exclude, 'Jane Doe', 'Sends correct project id');
    });

    test('Supports feature flag to turn it off', function () {
        this.$container.append('\n            <div id=\'test-1_container\'>\n                <select \n                    id=\'test-1\' \n                    class=\'js-default-multi-user-picker\'\n                    data-user-picker-enabled=\'true\'\n                    data-field-name=\'field_1002\'\n                    data-field-config-id=\'config_1001\'\n                    data-project-id=\'1000\'\n                    data-use-frother-control=\'false\'\n                ></select>\n                <a href=\'#\' class=\'popup-trigger\'>test1</a>\n            </div>\n        ');

        this.initMultiUserPickers(this.$container);

        sinon.assert.notCalled(this.MultiSelect, 'MultiSelect is not called.');
        sinon.assert.notCalled(this.NoBrowseUserNamePicker, 'NoBrowseUserNamePicker is not called.');
        sinon.assert.calledOnce(this.userPopUp.createUserPickerPopupTrigger, 'User popup is created if available.');
        sinon.assert.calledWithMatch(this.userPopUp.createUserPickerPopupTrigger, { triggerEvent: undefined });
    });
});
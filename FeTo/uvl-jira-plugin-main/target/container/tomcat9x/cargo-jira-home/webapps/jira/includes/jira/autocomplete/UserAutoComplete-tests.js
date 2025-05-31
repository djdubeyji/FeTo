AJS.test.require(['jira.webresources:autocomplete'], function () {
    'use strict';

    var UserPopup = require('jira/field/create-user-picker-popup-trigger');
    var UserAutoComplete = require('jira/autocomplete/user-autocomplete');
    var wrmContextPath = require('wrm/context-path');

    QUnit.config.testTimeout = 5000;

    module('UserAutoComplete', {
        setup: function setup() {
            this.createPopupStub = sinon.stub(UserPopup, "createUserPickerPopupTrigger");
        },
        teardown: function teardown() {
            this.createPopupStub.restore();
        }
    });

    test('init method should attach popup trigger with proper arguments if fieldset.user-picker-params is present', function () {
        var container = document.createElement('div');
        container.setAttribute('id', "test_container");
        container.innerHTML = '\n        <fieldset class="user-picker-params">\n            <input type="hidden" title="fieldId" value="test"/>\n            <input type="hidden" title="actionToOpen" value="test_actionToOpen"/>\n            <input type="hidden" title="formName" value="test_formName"/>\n            <input type="hidden" title="fieldName" value="test_fieldName"/>\n            <input type="hidden" title="multiSelect" value="test_multiSelect"/>\n            <input type="hidden" title="fieldConfigId" value="test_fieldConfigId"/>\n            <input type="hidden" title="projectId" value="test_projectId"/>\n        </fieldset>\n        <a href="#" class="popup-trigger"></a>';

        document.querySelector('#qunit-fixture').append(container);

        UserAutoComplete.init(container);

        var popupTrigger = container.querySelector('a.popup-trigger');

        if (popupTrigger) {
            popupTrigger.click();
        }

        sinon.assert.calledOnce(this.createPopupStub);
        sinon.assert.calledWith(this.createPopupStub, {
            urlBase: wrmContextPath(),
            actionToOpen: 'test_actionToOpen',
            formName: 'test_formName',
            fieldName: 'test_fieldName',
            multiSelect: 'test_multiSelect',
            fieldConfigId: 'test_fieldConfigId',
            projectIds: 'test_projectId'
        });
    });
});
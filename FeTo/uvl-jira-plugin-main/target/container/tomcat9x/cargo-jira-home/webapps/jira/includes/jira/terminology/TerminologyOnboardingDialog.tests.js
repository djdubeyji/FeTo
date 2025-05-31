AJS.test.require(['jira.webresources:terminology-onboarding-state', 'jira.webresources:terminology-onboarding-inline-dialogs'], function () {
    'use strict';

    var $ = require('jquery');
    var terminologyOnboardingDialog = require('jira/terminology-onboarding-dialog');
    module('TerminologyOnboardingDialog', {
        setup: function setup() {
            this.$fixture = $('#qunit-fixture');
            this.$container = $('<div/>');
            this.$trigger = $('<div/>').appendTo(this.$container);
            this.$container.appendTo(this.$fixture);
        },
        teardown: function teardown() {
            this.$fixture.empty();
        }
    });

    test('Correctly renders inline dialog in given container', function () {
        terminologyOnboardingDialog.addInlineDialogToField(this.$container, this.$trigger, { newNamePlural: 'Potatoes' }, 'sprint');
        var $inlineDialog = this.$container.find('aui-inline-dialog');
        var $triggerIcon = this.$trigger.find('.aui-iconfont-info-filled');
        ok($inlineDialog.length);
        ok($triggerIcon.length);
        equal($inlineDialog.attr('id'), 'terminology-onboarding-sprint');
        equal($triggerIcon.attr('aria-controls'), 'terminology-onboarding-sprint');
    });
});
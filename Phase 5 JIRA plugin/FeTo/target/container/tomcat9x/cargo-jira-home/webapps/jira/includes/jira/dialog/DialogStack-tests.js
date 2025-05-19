AJS.test.require(['jira.webresources:jira-dialog-core-stack'], function () {
    'use strict';

    module('DialogStack', {
        setup: function setup() {
            this.context = AJS.test.mockableModuleContext();
            this.DialogStack = this.context.require('jira/dialog/dialog-stack');
        }
    });

    test('Should support `current` prop reading/writing', function () {
        var o = {};
        this.DialogStack.current = o;
        strictEqual(this.DialogStack.current, o);

        var o2 = null;
        this.DialogStack.current = o2;
        strictEqual(this.DialogStack.current, o2);

        var o3 = undefined;
        this.DialogStack.current = o3;
        strictEqual(this.DialogStack.current, o3);
    });

    test('Should not allow to alter `current` prop', function () {
        var o = {};
        this.DialogStack.current = o;

        try {
            delete this.DialogStack.current;
        } catch (err) {
            strictEqual(err.name, 'TypeError');
        } finally {
            strictEqual(this.DialogStack.current, o);
        }
    });
});
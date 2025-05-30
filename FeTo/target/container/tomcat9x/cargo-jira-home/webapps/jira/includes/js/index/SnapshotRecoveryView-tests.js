AJS.test.require(['jira.webresources:reindex', 'jira.webresources:momentjs', 'jira.webresources:init-on-dcl'], function () {
    'use strict';

    require(['jquery'], function (jQuery) {
        module('SnapshotRecoveryView', {
            setup: function setup() {
                this.sandbox = sinon.sandbox.create({
                    useFakeServer: true
                });
                this.SmartAjax = {
                    makeRequest: this.sandbox.stub().returns(new jQuery.Deferred().resolve())
                };
                this.context = AJS.test.mockableModuleContext();
                this.SnapshotAutoComplete = this.sandbox.spy();
                this.context.mock('jira/autocomplete/snapshot-autocomplete', this.SnapshotAutoComplete);
                this.context.mock('jira/ajs/ajax/smart-ajax', this.SmartAjax);
                this.SnapshotRecoveryView = this.context.require('jira/index/snapshot-recovery-view');
            },
            teardown: function teardown() {
                this.sandbox.restore();
            }
        });

        test("Initializes autocomplete", function () {
            new this.SnapshotRecoveryView();
            sinon.assert.calledOnce(this.SnapshotAutoComplete);
        });

        test('Populates snapshot details', function () {
            new this.SnapshotRecoveryView();
            sinon.assert.calledTwice(this.SmartAjax.makeRequest);
        });

        // test('Enables create button', function () {
        //     var snapshotRecoveryView = new this.SnapshotRecoveryView();
        //     //TODO: how to assert?
        // });
        //
        // test('Disables create button when in progress', function () {
        //     var snapshotRecoveryView = new this.SnapshotRecoveryView();
        //     snapshotRecoveryView.onCreateSnapshotClick();
        //     //TODO: how to assert?
        // });

        test('When snapshot created, updates snapshot details', function () {
            var snapshotRecoveryView = new this.SnapshotRecoveryView();
            snapshotRecoveryView.pollCreateStatus();
            sinon.assert.calledThrice(this.SmartAjax.makeRequest);
        });
    });
});
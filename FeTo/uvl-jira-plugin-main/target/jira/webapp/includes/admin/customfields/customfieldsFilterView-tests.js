AJS.test.require(['jira.webresources:viewcustomfields'], function () {
    'use strict';

    var CustomfieldsFilterView = require('jira/customfields/customfieldsFilterView');
    var analytics = require('jira/analytics');

    module('CustomfieldsFilterView', {
        setup: function setup() {
            this.sandbox = sinon.sandbox.create();
            this.sandbox.spy(analytics, 'send');
        },

        teardown: function teardown() {
            this.sandbox.restore();
        }
    });

    test('Sends analytics event', function () {
        var _ref = new CustomfieldsFilterView(),
            sendAnalyticsFilterEvent = _ref.sendAnalyticsFilterEvent;

        sendAnalyticsFilterEvent('projectIds', ['1', 2]);
        deepEqual(analytics.send.lastCall.args[0], {
            name: 'admin.customfields.filter.projects',
            properties: {
                values: ['1', 2]
            }
        }, 'Handles project filter with numeric and number values');

        sendAnalyticsFilterEvent('types', []);
        deepEqual(analytics.send.lastCall.args[0], {
            name: 'admin.customfields.filter.types',
            properties: {
                values: []
            }
        }, 'Handles types filter with empty array of values');

        sendAnalyticsFilterEvent('screenIds');
        deepEqual(analytics.send.lastCall.args[0], {
            name: 'admin.customfields.filter.screens',
            properties: {
                values: []
            }
        }, 'Handles screens filter with falsy values');

        sendAnalyticsFilterEvent('lastValueUpdate', ['1234']);
        deepEqual(analytics.send.lastCall.args[0], {
            name: 'admin.customfields.filter.lastvalueupdate',
            properties: {
                values: ['1234']
            }
        }, 'Handles last value update filter');
    });
});
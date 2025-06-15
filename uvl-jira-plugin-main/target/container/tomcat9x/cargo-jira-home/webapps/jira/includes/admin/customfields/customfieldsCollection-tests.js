AJS.test.require(['jira.webresources:viewcustomfields'], function () {
    'use strict';

    var CustomfieldsCollection = require('jira/customfields/customfieldsCollection');
    var moment = require('jira/moment');

    module('CustomfieldsCollection', {
        setup: function setup() {
            this.sandbox = sinon.sandbox.create();
            this.collection = new CustomfieldsCollection();
        },
        teardown: function teardown() {
            this.sandbox.restore();
        }
    });

    test('passes proper values to backend', function () {
        this.collection.filters.projectIds = [];
        ok(this.collection.getFilterValues('projectIds') === undefined, 'Empty array is set to undefined');

        this.collection.filters.projectIds = [1];
        deepEqual(this.collection.getFilterValues('projectIds'), [1], 'Populated array is passed');

        this.collection.filters.sortColumn = null;
        ok(this.collection.getFilterValues('sortColumn') === undefined, 'Null is set to undefined');

        this.collection.filters.sortColumn = 'values';
        equal(this.collection.getFilterValues('sortColumn'), 'values', 'String is passed');

        this.collection.filters.lastValueUpdate = 1580295900000;
        equal(this.collection.getFilterValues('lastValueUpdate'), 1580295900000, 'Number is passed');

        this.collection.filters.lastValueUpdate = -1;
        equal(this.collection.getFilterValues('lastValueUpdate'), -1, 'Negative number is passed');
    });

    test('formats last value update date', function () {
        var SAMPLE_UPDATE = 1580295900000;
        var initialValues = [{ lastValueUpdate: SAMPLE_UPDATE }, {}];
        var result = this.collection.parseRecords({
            values: initialValues
        });

        equal(result[0].formattedLastValueUpdate, moment(SAMPLE_UPDATE).format('MMM DD, YYYY'), 'Date is properly formatted');
        equal(result[1].formattedLastValueUpdate, undefined, 'Date is not modified when it is undefined');
    });

    test('formats issues with value', function () {
        var _ref = new Intl.NumberFormat(),
            format = _ref.format;

        var result = this.collection.parseRecords({
            values: [{ issuesWithValue: 0 }, { issuesWithValue: undefined }, { issuesWithValue: 100000 }]
        });

        equal(result[0].formattedIssuesWithValue, 0, '0 is ignored');
        equal(result[1].formattedIssuesWithValue, undefined, 'undefined is ignored');
        equal(result[2].formattedIssuesWithValue, format(100000), 'Large numbers are formatted properly');
    });

    test('resets bulk delete state', function () {
        this.collection.add([{ isSelected: true }, { isSelected: false }, {}]);
        this.collection.resetDeleteData();
        deepEqual(this.collection.pluck('isSelected'), [false, false, false], 'bulk state is reset correctly');
    });

    test('returns selectable models', function () {
        this.collection.add([{ id: 1, isLocked: true }, { id: 2, isManaged: true }, { id: 3, isManaged: true, isLocked: false }, { id: 4, isManaged: false, isLocked: true }, { id: 5, isManaged: false }, { id: 6 }]);
        deepEqual(this.collection.getSelectableModels().map(function (model) {
            return { id: model.get('id') };
        }), [{ id: 5 }, { id: 6 }], 'does not mark managed and locked as selectable');
    });
});
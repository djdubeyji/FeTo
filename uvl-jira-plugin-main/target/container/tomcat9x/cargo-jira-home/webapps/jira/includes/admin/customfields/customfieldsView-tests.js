AJS.test.require(['jira.webresources:viewcustomfields'], function () {
    'use strict';

    var _ = require('underscore');
    var $ = require('jquery');
    var CustomfieldsPageView = require('jira/customfields/customfieldsView');
    var CustomfieldsCollection = require('jira/customfields/customfieldsCollection');
    var FeatureManager = require('jira/featureflags/feature-manager');
    var JiraMessage = require('jira/message');
    var MAX_RESULTS = new CustomfieldsCollection().state.pageSize;

    module('CustomfieldsPageView', {
        setup: function setup() {
            this.context = AJS.test.mockableModuleContext();
            this.sandbox = sinon.sandbox.create({ useFakeServer: true });

            this.customFields = [{
                name: 'CF 1',
                type: 'Number Field',
                contextSchemesCount: 1,
                screensCount: 1
            }, {
                name: 'CF 2',
                type: 'Magic Field',
                searcherKey: 'nosearcher',
                contextSchemesCount: 10,
                screensCount: 0
            }];

            this.sandbox.stub(FeatureManager, 'isFeatureEnabled', function (featureKey) {
                if (['jira.customfields.cleanup.identification', 'jira.customfields.bulk.delete'].includes(featureKey)) {
                    return true;
                }
                return false;
            });

            this.sandbox.stub(JiraMessage, 'showSuccessMsg');
            this.sandbox.stub(JiraMessage, 'showErrorMsg');

            $('#qunit-fixture').html('<section id="customfields-container"> </section>');

            this.mockCustomfieldsResponse();
            this.customfieldsPageView = new CustomfieldsPageView({ el: '#customfields-container' });
        },
        teardown: function teardown() {
            this.sandbox.restore();
        },
        mockCustomfieldsResponse: function mockCustomfieldsResponse() {
            this.sandbox.server.respondWith([200, {
                'Content-Type': 'application/json'
            }, JSON.stringify({
                maxResults: MAX_RESULTS,
                startAt: 0,
                total: this.customFields.length,
                isLast: true,
                values: this.customFields.map(function (field, idx) {
                    return _.extend({
                        id: 'customfield_' + (10000 + idx),
                        self: 'http://localhost:8090/jira/rest/api/2/customFields/customfield_' + (10000 + idx),
                        numericId: 10000 + idx,
                        isLocked: false,
                        isManaged: false,
                        isTrusted: idx === 0,
                        issuesWithValue: idx + 1,
                        searcherKey: 'asdsda'
                    }, field);
                })
            })]);
        }
    });

    test('Custom fields list is rendered', function () {
        this.sandbox.server.respond();

        var $tbody = $('#qunit-fixture #custom-fields-table tbody');
        var names = $tbody.find('tr td:first-child+td strong').map(function (i, el) {
            return el.innerHTML;
        }).get();
        var types = $tbody.find('tr>td:first-child+td+td>span').map(function (i, el) {
            return el.innerHTML;
        }).get();

        deepEqual(names, _.pluck(this.customFields, 'name'), 'Names are rendered');
        deepEqual(types, _.pluck(this.customFields, 'type'), 'Types are rendered');
    });

    test('Displays progress indicator on load', function () {

        var $container = $('#qunit-fixture #customfields-container');

        ok($container.hasClass('active'), 'has progress indicator overlay');
        ok($container.has('aui-spinner.customfields-spinner').length, 'has aui spinner');

        this.sandbox.server.respond();

        notOk($container.hasClass('active'), 'has no progress indicator overlay after data is loaded');
        notOk($container.has('aui-spinner.customfields-spinner').length, 'hides aui spinner after data is loaded');
    });

    test('Displays progress indicator on sort', function () {
        this.sandbox.server.respond();
        var $container = $('#qunit-fixture #customfields-container');
        var $th = $container.find('th[data-sort-key="lastValueUpdate"]');

        $th.trigger('click');

        ok($container.hasClass('active'), 'has progress indicator overlay');
        ok($container.has('aui-spinner.customfields-spinner').length, 'has aui spinner');

        this.sandbox.server.respond();

        notOk($container.hasClass('active'), 'has no progress indicator overlay after data is loaded');
        notOk($container.has('aui-spinner.customfields-spinner').length, 'hides aui spinner after data is loaded');
    });

    asyncTest('Displays progress indicator on search', function () {
        var _this = this;

        this.sandbox.server.respond();
        // Response for filters
        this.sandbox.server.respondWith([200, { 'Content-Type': 'application/json' }, JSON.stringify([])]);
        this.sandbox.server.respond();

        var $container = $('#qunit-fixture #customfields-container');
        var $searchInput = $container.find('#custom-fields-filter-text');
        //stop(); // pause the test
        $searchInput.val('blah').trigger('input');

        // wait for the debounce delay
        setTimeout(function () {
            ok($container.hasClass('active'), 'has progress indicator overlay');
            ok($container.has('aui-spinner').length, 'has aui spinner');

            _this.sandbox.server.respond();

            notOk($container.hasClass('active'), 'has no progress indicator overlay after data is loaded');
            notOk($container.has('aui-spinner.customfields-spinner').length, 'hides aui spinner after data is loaded');
            start();
        }, 1000);
    });

    asyncTest('Displays empty search results view on empty search', function () {
        var _this2 = this;

        this.sandbox.server.respond();
        // Response for filters
        this.sandbox.server.respondWith([200, { 'Content-Type': 'application/json' }, JSON.stringify([])]);
        this.sandbox.server.respond();

        var $container = $('#qunit-fixture #customfields-container');
        var $searchInput = $container.find('#custom-fields-filter-text');
        //stop(); // pause the test
        $searchInput.val('blah').trigger('input');

        // wait for the debounce delay
        setTimeout(function () {
            _this2.sandbox.server.respondWith([200, { 'Content-Type': 'application/json' }, JSON.stringify({
                maxResults: MAX_RESULTS,
                startAt: 0,
                total: 0,
                isLast: true,
                values: []
            })]);
            _this2.sandbox.server.respond();

            var $emptyViewRow = $('#qunit-fixture #custom-fields-table tbody tr');
            ok($emptyViewRow.length, 'only one row for empty result message is rendered');
            ok($emptyViewRow.find('.jira-adbox.no-project-results').length, 'empty view is displayed');

            notOk($container.hasClass('active'), 'has no progress indicator overlay on empty screen');
            notOk($container.has('aui-spinner.customfields-spinner').length, 'hides aui spinner after displaying empty screen');

            start();
        }, 1000);
    });

    asyncTest('Displays error flag on search failure', function () {
        var _this3 = this;

        $('#aui-flag-container').remove();
        this.sandbox.server.respond();

        var $container = $('#qunit-fixture #customfields-container');
        var $searchInput = $container.find('#custom-fields-filter-text');
        //stop(); // pause the test
        $searchInput.val('blah').trigger('input');

        // wait for the debounce delay
        setTimeout(function () {

            _this3.sandbox.server.respondWith([404, {}, '']);
            _this3.sandbox.server.respond();

            ok(JiraMessage.showErrorMsg.lastCall.calledWith(sinon.match('rest.error.internal')), 'error message is correct');

            notOk($container.hasClass('active'), 'has no progress indicator overlay after search failure');
            notOk($container.has('aui-spinner.customfields-spinner').length, 'hides aui spinner after search failure');

            start();
        }, 1000);
    });

    test('Displays error flag on sort failure', function () {
        $('#aui-flag-container').remove();
        this.sandbox.server.respond();
        var $container = $('#qunit-fixture #customfields-container');

        $container.find('th[data-sort-key="issuesWithValue"]').trigger('click');
        this.sandbox.server.respondWith([500, {}, '']);
        this.sandbox.server.respond();

        ok(JiraMessage.showErrorMsg.lastCall.calledWith(sinon.match('rest.error.internal')), 'error message is correct');

        notOk($container.hasClass('active'), 'has no progress indicator overlay after sort failure');
        notOk($container.has('aui-spinner.customfields-spinner').length, 'hides aui spinner after sort failure');
    });

    test('Projects link is correctly displayed', function () {

        this.customFields = [{
            name: 'CF 3',
            type: 'Number Field',
            isAllProjects: true,
            projectsCount: 0,
            screensCount: 1
        }, {
            name: 'CF 4',
            type: 'Number Field',
            isAllProjects: false,
            projectsCount: 0,
            screensCount: 1
        }, {
            name: 'CF 5',
            type: 'Test Field',
            searcherKey: 'nosearcher',
            isAllProjects: false,
            projectsCount: 10,
            screensCount: 3
        }];
        this.mockCustomfieldsResponse();
        this.sandbox.server.respond();

        var $customFieldsTableBody = $('#qunit-fixture #customfields-container #custom-fields-table tbody');

        equal($customFieldsTableBody.find('tr:first td:eq(3)').text(), 'admin.issuefields.customfields.global.all.projects', 'displays global projects read onlytext');

        equal($customFieldsTableBody.find('tr:eq(1) td:eq(3)').text(), 'admin.issuefields.customfields.projects.conditional', 'displays 0 projects read only text');
        notOk($customFieldsTableBody.find('tr:eq(1) td:eq(3)').has('a').length, '0 projects text is read only');

        equal($customFieldsTableBody.find('tr:eq(2) td:eq(3)').text(), 'admin.issuefields.customfields.projects.conditional', 'displays n projects text');
        ok($customFieldsTableBody.find('tr:eq(2) td:eq(3)').has('a').length, 'n projects text is clickable link');
    });

    test('DC - Custom fields list can be sorted and resetted', function () {
        this.sandbox.server.respond();
        var $container = $('#qunit-fixture #customfields-container');

        equal($container.find('th[data-sort-key="issuesWithValue"]').data('sort-order'), '', 'No initial sorting');

        $container.find('th[data-sort-key="issuesWithValue"]').trigger('click');
        this.sandbox.server.respond();
        equal($container.find('th[data-sort-key="issuesWithValue"]').data('sort-order'), 'ascending', 'Sorts ascending');

        $container.find('th[data-sort-key="issuesWithValue"]').trigger('click');
        this.sandbox.server.respond();
        equal($container.find('th[data-sort-key="issuesWithValue"]').data('sort-order'), 'descending', 'Sorts descending');

        $container.find('th[data-sort-key="issuesWithValue"]').trigger('click');
        this.sandbox.server.respond();
        equal($container.find('th[data-sort-key="issuesWithValue"]').data('sort-order'), '', 'Sort is resetted');
    });

    test('DC - Custom fields usage data is displayed for trusted and untrusted fields', function () {
        var $container = $('#qunit-fixture #customfields-container');
        this.sandbox.server.respondWith([200, { 'Content-Type': 'application/json' }, JSON.stringify({
            maxResults: MAX_RESULTS,
            startAt: 0,
            total: this.customFields.length,
            isLast: true,
            values: this.customFields.map(function (field, idx) {
                return _.extend({
                    id: 'customfield_' + (10000 + idx),
                    self: 'http://localhost:8090/jira/rest/api/2/customFields/customfield_' + (10000 + idx),
                    numericId: 10000 + idx,
                    isLocked: false,
                    isTrusted: idx === 0,
                    isManaged: false,
                    searcherKey: 'asdsda'
                }, field);
            })
        })]);
        this.sandbox.server.respond();

        notOk($container.find('tr[data-custom-field-id]:eq(0) .customfield-help-icon').length, 'hides untrusted field icon');
        ok($container.find('tr[data-custom-field-id]:eq(1) .customfield-help-icon').length, 'shows untrusted field icon');

        equal($container.find('tr[data-custom-field-id]:eq(0) td:eq(6)').text(), '0', 'trusted field displays zero');
        equal($container.find('tr[data-custom-field-id]:eq(1) td:eq(6)').text(), 'admin.issuefields.customfields.no.data', 'untrusted field displays copy text');

        equal($container.find('tr[data-custom-field-id]:eq(0) td:eq(5)').text(), 'admin.common.words.never', 'trusted field displays correct "no usage" copy');
        equal($container.find('tr[data-custom-field-id]:eq(1) td:eq(5)').text(), 'admin.issuefields.customfields.no.data', 'untrusted field displays correct "no usage" copy');

        this.mockCustomfieldsResponse();
        $container.find('th[data-sort-key="issuesWithValue"]').trigger('click');
        this.sandbox.server.respond();

        equal($container.find('tr[data-custom-field-id]:eq(0) td:eq(6)').text(), '1', 'trusted field displays positive issues count');
        equal($container.find('tr[data-custom-field-id]:eq(1) td:eq(6)').text(), '2', 'untrusted field displays positive issues count');
    });

    test('DC - Single custom field can be deleted', function () {
        this.mockCustomfieldsResponse();
        this.sandbox.server.respond();
        var $container = $('#qunit-fixture #customfields-container');

        $container.find('table .aui-dropdown2-trigger').eq(0).trigger('click');
        $container.find('.customfield-delete-trigger').eq(0).trigger('click');
        ok($('#customfield-delete-dialog[open]').length, 'dialog is open');

        var $submitButton = $('#customfield-delete-dialog .customfield-delete-dialog-submit');
        var $spinner = $('#customfield-delete-dialog .customfield-delete-dialog-spinner');

        $submitButton.click();
        ok($submitButton.prop('disabled'), 'submit button is disabled');
        notOk($spinner.hasClass('hidden'), 'spinner is visible');
        this.sandbox.server.respondWith([500, {}, JSON.stringify({ deletedCustomFields: [], notDeletedCustomFields: ['customfield_10000'] })]);
        this.sandbox.server.respond();
        ok(JiraMessage.showErrorMsg.lastCall.calledWith(sinon.match('rest.error.internal')), 'error message is correct');

        $container.find('table .aui-dropdown2-trigger').eq(0).trigger('click');
        $container.find('.customfield-delete-trigger').eq(0).trigger('click');
        $submitButton.click();
        this.sandbox.server.respondWith([200, { 'Content-Type': 'application/json' }, JSON.stringify({ deletedCustomFields: ['customfield_10000'], notDeletedCustomFields: [] })]);
        this.sandbox.server.respond();
        notOk($submitButton.prop('disabled'), 'submit button is enabled');
        ok($spinner.hasClass('hidden'), 'spinner is hidden');
        notOk($('#customfield-delete-dialog[open]').length, 'dialog is hidden');
        ok(JiraMessage.showSuccessMsg.lastCall.calledWith('admin.issuefields.customfields.delete.single.success'), 'success message is correct');
    });

    test('DC - Bulk selection works properly', function () {
        var SAMPLE_FIELDS = [{
            isLocked: true
        }, {
            isManaged: true
        }, {}, {
            isManaged: false
        }];

        this.sandbox.server.respondWith([200, { 'Content-Type': 'application/json' }, JSON.stringify({
            maxResults: MAX_RESULTS,
            startAt: 0,
            total: SAMPLE_FIELDS.length,
            isLast: true,
            values: SAMPLE_FIELDS.map(function (field, idx) {
                return _.extend({
                    id: 'customfield_' + (10000 + idx),
                    name: 'customfield_' + (10000 + idx),
                    screensCount: 1,
                    projectsCount: 1,
                    self: 'http://localhost:8090/jira/rest/api/2/customFields/customfield_' + (10000 + idx),
                    numericId: 10000 + idx,
                    searcherKey: idx,
                    isTrusted: !field.isManaged && !field.isLocked
                }, field);
            })
        })]);

        this.sandbox.server.respond();
        var $container = $('#qunit-fixture #customfields-container');

        function getCheckboxAtRow(rowId) {
            return $container.find('tr[data-custom-field-id]:eq(' + rowId + ') td:eq(0) input[type=checkbox]');
        }
        function getBulkCheckbox() {
            return $container.find('.custom-fields-bulk-checkbox');
        }
        function getBulkDeleteButton() {
            return $container.find('.custom-fields-bulk-delete');
        }
        function getCancelButton() {
            return $('#customfield-delete-dialog .customfield-delete-dialog-cancel');
        }
        function getContent() {
            return $('#customfield-delete-dialog .customfield-delete-dialog-content');
        }

        // selectable and unselectable custom fields
        ok(getCheckboxAtRow(0).prop('disabled'), 'Locked custom field is unselectable');
        ok(getCheckboxAtRow(1).prop('disabled'), 'Managed custom field is unselectable');
        notOk(getCheckboxAtRow(2).prop('disabled'), 'Not managed or locked CF is selectable');

        // global bulk checkbox basic behaviour
        getBulkCheckbox().trigger('click');
        equal($container.find('tbody input:checked').length, 2, 'Bulk checkbox selects all valid inputs');
        getBulkCheckbox().trigger('click');
        equal($container.find('tbody input:checked').length, 0, 'Bulk checkbox unselects all inputs');

        // global bulk checkbox vs single checkboxes
        getCheckboxAtRow(2).trigger('click');
        ok($container.find('.customfields-bulk-delete-meta').text().includes('admin.issuefields.customfields.bulk.select.single'), 'Sets single delete copy');
        getCheckboxAtRow(3).trigger('click');
        ok($container.find('.customfields-bulk-delete-meta').text().includes('admin.issuefields.customfields.bulk.select.multiple'), 'Sets multiple delete copy');
        ok(getBulkCheckbox().prop('checked'), 'After all single checks, global is checked too');
        getCheckboxAtRow(3).trigger('click');
        notOk(getBulkCheckbox().prop('checked'), 'After all single checks and then one uncheck, global is unchecked too');

        // bulk delete button and dialog - bulk case
        getBulkCheckbox().trigger('click');
        getBulkDeleteButton().trigger('click');
        ok($('#customfield-delete-dialog[open]').length, 'Delete dialog is open when clicked delete after bulk check');
        ok(getContent().text().includes('admin.issuefields.customfields.delete.bulk.info'), 'Delete dialog informs about bulk deletion');
        getCancelButton().trigger('click');

        // bulk delete button and dialog - single case
        getCheckboxAtRow(2).trigger('click');
        getBulkDeleteButton().trigger('click');
        ok($('#customfield-delete-dialog[open]').length, 'Delete dialog is open when clicked delete after single check');
        ok(getContent().text().includes('admin.issuefields.customfields.delete.single.info'), 'Delete dialog informs about single deletion');
        getCancelButton().trigger('click');
    });
    test('DC - Disables selection when it\'s not available', function () {
        var DISABLED_FIELDS = [{
            isLocked: true
        }, {
            isManaged: true
        }];
        this.sandbox.server.respondWith([200, { 'Content-Type': 'application/json' }, JSON.stringify({
            maxResults: MAX_RESULTS,
            startAt: 0,
            total: DISABLED_FIELDS.length,
            isLast: true,
            values: DISABLED_FIELDS.map(function (field, idx) {
                return _.extend({
                    id: 'customfield_' + (10000 + idx),
                    name: 'customfield_' + (10000 + idx),
                    screensCount: 1,
                    projectsCount: 1,
                    self: 'http://localhost:8090/jira/rest/api/2/customFields/customfield_' + (10000 + idx),
                    numericId: 10000 + idx,
                    searcherKey: idx,
                    isTrusted: !field.isManaged && !field.isLocked
                }, field);
            })
        })]);
        this.sandbox.server.respond();
        var $container = $('#qunit-fixture #customfields-container');

        notOk($container.find('.custom-fields-bulk-checkbox').prop('checked'), 'Given unselectable results, bulk checkbox is not checked');
        ok($container.find('.custom-fields-bulk-checkbox').prop('disabled'), 'Given unselectable results, bulk checkbox is disabled');
    });
    test('DC - Delete REST endpoint is returning correct error message', function () {
        this.mockCustomfieldsResponse();
        this.sandbox.server.respond();
        var $container = $('#qunit-fixture #customfields-container');
        $container.find('.custom-fields-bulk-checkbox').trigger('click');
        $container.find('.custom-fields-bulk-delete').trigger('click');

        var $submitButton = $('#customfield-delete-dialog .customfield-delete-dialog-submit');

        this.sandbox.server.respondWith([400, {}, '']);
        $submitButton.click();
        this.sandbox.server.respond();
        ok(JiraMessage.showErrorMsg.lastCall.calledWith(sinon.match('admin.issuefields.customfields.delete.error.zero.title')), '400 is supported');

        this.sandbox.server.respondWith([423, {}, '']);
        $submitButton.click();
        this.sandbox.server.respond();
        ok(JiraMessage.showErrorMsg.lastCall.calledWith(sinon.match('admin.issuefields.customfields.delete.error.clusterlock.title')), '423 cluster lock error is supported');

        this.sandbox.server.respondWith([500, {}, '']);
        $submitButton.click();
        this.sandbox.server.respond();
        ok(JiraMessage.showErrorMsg.lastCall.calledWith(sinon.match('rest.error.internal')), '500 internal server error is supported');

        this.sandbox.server.respondWith([503, {}, '']);
        $submitButton.click();
        this.sandbox.server.respond();
        ok(JiraMessage.showErrorMsg.lastCall.calledWith(sinon.match('admin.issuefields.customfields.delete.error.settings')), '503 license/flag check is supported');

        this.sandbox.server.respondWith([200, { 'Content-Type': 'application/json' }, JSON.stringify({
            deletedCustomFields: ['customfield_10001', 'customfield_10002'],
            notDeletedCustomFields: ['customfield_10003']
        })]);
        $submitButton.click();
        this.sandbox.server.respond();
        ok(JiraMessage.showSuccessMsg.lastCall.calledWith(sinon.match('admin.issuefields.customfields.delete.bulk.success')), 'Shows success flag on some successful results');
        ok(JiraMessage.showErrorMsg.lastCall.calledWith(sinon.match('admin.issuefields.customfields.delete.error.some.title')), 'Shows error flag on some unsuccessful results');
    });

    module('CustomfieldsPageView - Server', {
        setup: function setup() {
            this.context = AJS.test.mockableModuleContext();
            this.sandbox = sinon.sandbox.create({ useFakeServer: true });

            this.sandbox.stub(FeatureManager, 'isFeatureEnabled', function () {
                return false;
            });
        }
    });

    test('Feature flag turns new UI off', function () {
        this.sandbox.server.respondWith(200, { 'Content-Type': 'application/json' }, '');
        this.sandbox.server.respond();

        var $container = $('#qunit-fixture #customfields-container');
        notOk($container.find('.custom-fields-bulk-checkbox').length, 'Bulk delete is hidden');
        notOk($container.find('.customfield-values').length, 'Issues column is hidden');
        notOk($container.find('.customfield-updates').length, 'Updates column is hidden');
        notOk($container.find('#last-value-update').length, 'Last value update filter is hidden');
        notOk($container.find('.customfields-recalculation-details').length, 'Recalculation details are hidden');
    });
});
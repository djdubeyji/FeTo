AJS.test.require(['jira.webresources:searchers'], function () {
    'use strict';

    var _this = this;

    module('commonPickersUtils', {
        setup: function setup() {
            _this.commonPickersUtils = require('jira/searchers/element/common-pickers-utils');

            _this.fixture = document.getElementById('qunit-fixture');
            _this.fixture.innerHTML = '\n            <div class="search-criteria">\n                <ul class="criteria-list">\n                    <li data-id="project">\n                        <div class="searcherValue" data-selected-projects-ids="26600,10000" data-selected-issue-type-ids="18200,10000,10102">\n                        </div>\n                    </li>\n                </ul>\n            </div>';
        },
        teardown: function teardown() {}
    });

    test('should define getSelectedProjectsIds() method', function () {
        // given
        var expectedProjectIds = ['26600', '10000'];

        // when
        var selectedProjectIds = _this.commonPickersUtils.getSelectedProjectsIds();

        // then
        deepEqual(selectedProjectIds, expectedProjectIds, 'Returns correct project IDs');
    });

    test('should define getSelectedIssueTypeIds() method', function () {
        // given
        var expectedIssueTypeIds = ['18200', '10000', '10102'];

        // when
        var selectedIssueTypeIds = _this.commonPickersUtils.getSelectedIssueTypeIds();

        // then
        deepEqual(selectedIssueTypeIds, expectedIssueTypeIds, 'Returns correct project IDs');
    });
});
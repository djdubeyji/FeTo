AJS.test.require(['jira.webresources:searchers'], function () {
    'use strict';

    var _this = this;

    module('commonPickersConfig', {
        setup: function setup() {
            _this.commonPickersConfig = require('jira/searchers/element/common-pickers-config');
        },
        teardown: function teardown() {}
    });

    test('should define default options for pickers', function () {
        // then
        equal(_this.commonPickersConfig.DEFAULT_MAX_RESULTS, 100, '`Max results` option is correctly set');
        equal(_this.commonPickersConfig.DEFAULT_START_AT, 0, '`Start at` option is correctly set');
        equal(_this.commonPickersConfig.DEFAULT_MAX_RESULTS_PER_GROUP, 100, '`Max results` per group option is correctly set');
    });
});
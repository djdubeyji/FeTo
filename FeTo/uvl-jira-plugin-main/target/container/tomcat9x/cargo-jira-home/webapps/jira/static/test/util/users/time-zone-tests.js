AJS.test.require("jira.webresources:user-time-zone", function () {
    "use strict";

    module('User time-zone data module', {
        setup: function setup() {
            this.mockedContext = AJS.test.mockableModuleContext();
            this.wrmData = {
                claim: sinon.stub()
            };
            this.mockedContext.mock('wrm/data', this.wrmData);
        }
    });

    test("Should return save claimed data", function () {
        this.wrmData.claim.returns({ offset: '(GMT+12:34)' });

        var TimeZoneData = this.mockedContext.require('jira/util/users/time-zone');

        sinon.assert.calledWith(this.wrmData.claim, 'jira.core:userTimeZoneProvider.data');
        deepEqual(TimeZoneData, { offset: '(GMT+12:34)' });
    });

    test("Should handle case when data is not present", function () {
        this.wrmData.claim.returns(undefined);

        var TimeZoneData = this.mockedContext.require('jira/util/users/time-zone');

        sinon.assert.calledWith(this.wrmData.claim, 'jira.core:userTimeZoneProvider.data');
        deepEqual(TimeZoneData, {});
    });
});
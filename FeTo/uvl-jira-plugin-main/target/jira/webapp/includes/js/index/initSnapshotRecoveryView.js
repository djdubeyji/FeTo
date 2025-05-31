require(['jira/util/init-on-dcl', 'jira/index/snapshot-recovery-view'], function (initOnDCL, SnapshotRecoveryView) {
    'use strict';

    initOnDCL(function () {
        new SnapshotRecoveryView();
    });
});
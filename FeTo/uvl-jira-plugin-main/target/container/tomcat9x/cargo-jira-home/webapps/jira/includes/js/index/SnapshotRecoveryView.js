define('jira/index/snapshot-recovery-view', ['jquery', 'jira/autocomplete/snapshot-autocomplete', 'jira/ajs/ajax/smart-ajax', 'jira/backbone-1.3.3', 'jira/message', 'jira/moment', 'jira/util/data/meta', 'jira/moment/moment.jira.formatter', 'jira/analytics', 'wrm/context-path', 'jira/util/formatter'], function ($, SnapshotAutoComplete, SmartAjax, Backbone, Messages, moment, meta, momentFmt, analytics, wrmContextPath, formatter) {
    'use strict';

    var MOMENT_FORMAT = momentFmt.translateSimpleDateFormat(meta.get('date-complete'));

    var CREATE_STATUS = {
        IN_PROGRESS: 'in-progress',
        UNKNOWN: 'unknown',
        NONE: 'none'
    };

    var SnapshotRecoveryView = Backbone.View.extend({
        el: '#index-recovery',
        events: {
            'click #create-index-snapshot': 'onCreateSnapshotClick'
        },
        initialize: function initialize() {
            this.$createButton = this.$el.find('#create-index-snapshot');
            this.$createInProgressMessage = this.$el.find('#create-index-snapshot-in-progress-message');
            this.$snapshotGenerationStatus = this.$el.find('#snapshot-generation-status');
            this.$lastSnapshotName = this.$el.find('#last-index-snapshot-name');
            this.$lastSnapshotDate = this.$el.find('#last-index-snapshot-date');

            this.pollingTimeoutDefaultValue = 20000; // 20 seconds.
            this.pollingTimeout = this.pollingTimeoutDefaultValue; // Init with the default value.

            this.initSnapshotAutoComplete();

            this.model = new Backbone.Model({
                createStatus: CREATE_STATUS.UNKNOWN,
                lastSnapshotName: '',
                lastSnapshotDate: ''
            });
            this.model.on('change:createStatus', this.onCreateStatusChange.bind(this));
            this.model.on('change:lastSnapshotName change:lastSnapshotDate', this.onLastSnapshotDetailChange.bind(this));

            this.pollCreateStatus();
            this.loadLastSnapshotDetails();
        },
        initSnapshotAutoComplete: function initSnapshotAutoComplete() {
            SnapshotAutoComplete({
                field: $('#index-recovery-file-name'),
                minQueryLength: 0,
                queryDelay: 0
            });
        },
        onCreateStatusChange: function onCreateStatusChange(model, createStatus) {
            this.$createButton.prop('disabled', createStatus === CREATE_STATUS.IN_PROGRESS);
            this.$createInProgressMessage.prop('hidden', createStatus !== CREATE_STATUS.IN_PROGRESS);
            this.$snapshotGenerationStatus.html(createStatus === CREATE_STATUS.IN_PROGRESS ? formatter.I18n.getText('admin.index.status.in.progress') : formatter.I18n.getText('admin.index.status.ready'));
        },
        onLastSnapshotDetailChange: function onLastSnapshotDetailChange() {
            this.$lastSnapshotName.html(this.model.get('lastSnapshotName'));
            var lastSnapshotDate = this.model.get('lastSnapshotDate');
            this.$lastSnapshotDate.html(lastSnapshotDate ? moment(this.model.get('lastSnapshotDate')).format(MOMENT_FORMAT) : formatter.I18n.getText('common.concepts.not.applicable'));
        },
        onCreateSnapshotClick: function onCreateSnapshotClick() {
            analytics.send({ name: 'admin.index.snapshot.create.click' });
            this.model.set('createStatus', CREATE_STATUS.IN_PROGRESS);
            this.pollingTimeout = 1000; // 1 second. This lowers the polling timeout immediately after click for small snapshot cases.
            SmartAjax.makeRequest({
                method: 'POST',
                url: wrmContextPath() + '/rest/api/2/index-snapshot',
                success: function success(data) {
                    Messages.showSuccessMsg(formatter.I18n.getText('admin.index.create.in.progress', data.futureAbsolutePath), {
                        closeable: true,
                        timeout: 30
                    });
                },
                error: function error(xhr) {
                    if (xhr.status === 409) {
                        Messages.showErrorMsg(formatter.I18n.getText('admin.index.create.blocked'), {
                            closeable: true,
                            timeout: 30
                        });
                    } else {
                        Messages.showErrorMsg(formatter.I18n.getText('admin.index.create.error'), {
                            closeable: true,
                            timeout: 30
                        });
                    }
                }
            });
        },
        loadLastSnapshotDetails: function loadLastSnapshotDetails() {
            var _this = this;

            SmartAjax.makeRequest({
                url: wrmContextPath() + '/rest/api/2/index-snapshot',
                success: function success(data) {
                    var lastSnapshot = data.sort(function (a, z) {
                        return z.timestamp - a.timestamp;
                    })[0];
                    _this.model.set({
                        lastSnapshotDate: lastSnapshot ? lastSnapshot.timestamp : null,
                        lastSnapshotName: lastSnapshot ? lastSnapshot.absolutePath : formatter.I18n.getText('common.concepts.not.applicable')
                    });
                },
                error: function error() {
                    Messages.showErrorMessage(formatter.I18n.getText('admin.index.status.error'), {
                        closeable: true
                    });
                }
            });
        },
        pollCreateStatus: function pollCreateStatus() {
            var _this2 = this;

            SmartAjax.makeRequest({
                method: 'GET',
                url: wrmContextPath() + '/rest/api/2/index-snapshot/isRunning',
                success: function success(_ref) {
                    var running = _ref.running;

                    if (_this2.model.get('createStatus') === CREATE_STATUS.IN_PROGRESS && running === false) {
                        _this2.loadLastSnapshotDetails();
                    }
                    _this2.model.set('createStatus', running ? CREATE_STATUS.IN_PROGRESS : CREATE_STATUS.NONE);
                },
                error: function error() {
                    _this2.model.set('createStatus', CREATE_STATUS.NONE);
                },
                complete: function complete() {
                    setTimeout(_this2.pollCreateStatus.bind(_this2), _this2.getPollingTimeout());
                }
            });
        },
        getPollingTimeout: function getPollingTimeout() {
            if (this.pollingTimeout < this.pollingTimeoutDefaultValue) {
                this.pollingTimeout *= 2; // increase the polling period gradually if it is below the default value.
            }
            if (this.pollingTimeout > this.pollingTimeoutDefaultValue) {
                this.pollingTimeout = this.pollingTimeoutDefaultValue; // decrease the polling period back to default value.
            }
            return this.pollingTimeout;
        }
    });

    return SnapshotRecoveryView;
});
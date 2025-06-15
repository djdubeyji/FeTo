/**
 * Display information about issues count recalculation status.
 * Background job recalculates number of issues with the custom field value
 * @since 8.15
 * @see {@link com.atlassian.jira.issue.fields.usage.CustomFieldUsageRecalculationJob}
 */
define('jira/customfields/customfieldsRecalculationDetailsView', ['jira/backbone-1.3.3', 'jira/marionette-4.1', 'jira/moment', 'jira/ajs/ajax/smart-ajax', 'wrm/context-path'], function (Backbone, Marionette, moment, SmartAjax, contextPath) {
    'use strict';

    var RECALCULATION_DATE_ENDPOINT = contextPath() + '/rest/api/2/application-properties?key=com.atlassian.jira.issue.fields.usage.calc.date';

    return Marionette.View.extend({
        initialize: function initialize() {
            this.model = new Backbone.Model({
                isReady: false,
                issuesRecalculationDate: null
            });
            this.listenTo(this.model, 'change', this.render.bind(this));
            this.poll = this.poll.bind(this);

            this.poll();
        },
        template: JIRA.Templates.Admin.Customfields.recalculationDetails,
        templateContext: function templateContext() {
            return {
                issuesRecalculationDate: this.model.get('issuesRecalculationDate'),
                isReady: this.model.get('isReady')
            };
        },
        onBeforeDestroy: function onBeforeDestroy() {
            clearTimeout(this.pollTimeout);
        },
        onRender: function onRender() {
            this.$('.customfield-help-icon').tooltip({ gravity: 'ne' });
        },
        poll: function poll() {
            var _this = this;

            SmartAjax.makeRequest({
                url: RECALCULATION_DATE_ENDPOINT,
                success: function success(issuesRecalculationDateProperty) {
                    var timestamp = Number(issuesRecalculationDateProperty.value);
                    if (timestamp === 0 || Number.isNaN(timestamp)) {
                        _this.setError();
                    } else {
                        _this.setDate(timestamp);
                    }
                },
                error: function error() {
                    if (!_this.model.get('issuesRecalculationDate')) {
                        _this.setError();
                    }
                },
                complete: function complete() {
                    _this.pollTimeout = setTimeout(_this.poll, 60000);
                }
            });
        },
        /**
         * Sets last recalc date to current date
         * @param {number} timestamp
         */
        setDate: function setDate(timestamp) {
            this.model.set({
                isReady: true,
                issuesRecalculationDate: moment(timestamp).format('MMM DD, YYYY h:mm a')
            });
        },
        /**
         * Sets error state
         */
        setError: function setError() {
            this.model.set({
                isReady: true,
                issuesRecalculationDate: null
            });
        }
    });
});
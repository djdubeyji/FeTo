define('jira/viewissue/watchers-voters/views/voters-view', ['require'], function (require) {
    'use strict';

    var AuiMessages = require('aui/message');
    var Backbone = require('jira/backbone-1.3.3');
    var _ = require('underscore');
    var jQueryDeferred = require('jira/jquery/deferred');
    var formatter = require('jira/util/formatter');
    var TEMPLATES = JIRA.Templates.Issue;

    /**
     * View for Voters
     * @class VotersView
     * @extends Backbone.View
     */
    return Backbone.View.extend({
        $empty: undefined,

        initialize: function initialize(options) {
            this.collection = options.collection;
        },

        renderNoWatchers: function renderNoWatchers() {
            if (this.$(".recipients li").length === 0) {
                this.$empty = AuiMessages.info({
                    closeable: false,
                    body: formatter.I18n.getText("voters.novoters")
                });
                this.$("fieldset").append(this.$empty);
            } else if (this.$empty) {
                this.$empty.remove();
            }
        },

        /**
         * Goes to server to get watchers before rendering contents
         *
         * @return {jQueryDeferred}
         */
        render: function render() {
            var deferred = jQueryDeferred();
            this.collection.fetch().done(_.bind(function () {
                this.$el.html(TEMPLATES.usersListReadOnly({ users: this.collection.toJSON() }));
                this.renderNoWatchers();
                deferred.resolve(this.$el);
            }, this));
            return deferred.promise();
        }
    });
});
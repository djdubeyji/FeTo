define('jira/viewissue/watchers-voters/views/watchers-view', ['require', 'wrm/context-path'], function (require, wrmContextPath) {
    'use strict';

    var AbstractWatchersView = require('jira/viewissue/watchers-voters/views/abstract-watchers-view');
    var Meta = require('jira/util/data/meta');
    var _ = require('underscore');
    var logger = require('jira/util/logger');
    var MultiUserListPicker = require('jira/field/multi-user-list-picker');
    var TEMPLATES = JIRA.Templates.Issue;

    /**
     * View to handles internal content of inline dialog
     *
     * @class WatchersView
     * @extends AbstractWatchersView
     */
    return AbstractWatchersView.extend({

        events: {
            selected: "addWatcherToModel",
            unselect: "removeWatcherFromModel"
        },

        /**
         * Renders contents. Should only be called when watchers have been fetched.
         * @private
         */
        _render: function _render() {
            this.$el.html(TEMPLATES.watchersWithBrowse({ watchers: this.collection.toJSON() }));
            var issueKey = JIRA.Issues.Api.getSelectedIssueKey();
            var picker = new MultiUserListPicker({
                element: this.$el.find(".watchers-user-picker"),
                width: 220,
                ajaxOptions: {
                    url: wrmContextPath() + "/rest/api/1.0/users/picker/filter",
                    data: {
                        issueKey: issueKey
                    }
                }
            });
            this.$el.find('.js-add-watchers-label').attr('for', picker.$field.attr('id'));
        },

        /**
         * @inheritdoc
         */
        focus: function focus() {
            this.$el.find("#watchers-textarea").focus();
        },

        /**
         * Adds watcher on server
         * @param e
         * @param descriptor
         */
        addWatcherToModel: function addWatcherToModel(e, descriptor) {
            e.preventDefault();
            this.collection.addWatcher(descriptor.value()).done(_.bind(function () {
                this._incrementWatcherCount();
                if (descriptor.value() === Meta.get("remote-user")) {
                    this.watch();
                }
            }, this));
        },

        /**
         * Removes watcher on server
         * @param e
         * @param descriptor
         */
        removeWatcherFromModel: function removeWatcherFromModel(e, descriptor) {
            this.collection.removeWatcher(descriptor.value()).done(_.bind(function () {
                this._decrementWatcherCount();
                if (descriptor.value() === Meta.get("remote-user")) {
                    this.unwatch();
                    logger.trace("jira.issue.watcher.deleted");
                }
            }, this));
        }
    });
});
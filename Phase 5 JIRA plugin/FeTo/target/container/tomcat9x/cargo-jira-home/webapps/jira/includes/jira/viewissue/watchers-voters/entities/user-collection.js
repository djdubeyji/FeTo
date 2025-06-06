define('jira/viewissue/watchers-voters/entities/user-collection', ['require'], function (require) {
    'use strict';

    var Messages = require('jira/message');
    var Backbone = require('jira/backbone-1.3.3');
    var _ = require('underscore');
    var $ = require('jquery');
    var contextPath = require('wrm/context-path');
    var formatter = require('jira/util/formatter');
    var TEMPLATES = JIRA.Templates.Issue;

    var JIRAUserModel = Backbone.Model.extend({
        idAttribute: "key"
    });

    return Backbone.Collection.extend({
        model: JIRAUserModel,

        initialize: function initialize(options) {
            if (options === undefined) {
                throw new Error("Must supply options");
            }
            if (options.issueKey) {
                this.issueKey = options.issueKey;
            } else {
                throw new Error("Must supply issue key");
            }

            if (options.endpoint) {
                this.endpoint = options.endpoint;
            } else {
                throw new Error("Must supply an endpoint");
            }

            if (options.modelKey) {
                this.modelKey = options.modelKey;
            } else {
                throw new Error("Must supply an model key");
            }
        },

        url: function url() {
            return [contextPath(), 'rest/api/2/issue', this.issueKey, this.endpoint].join("/");
        },

        parse: function parse(response) {
            return response && response[this.modelKey] ? response[this.modelKey] : [];
        },

        ajax: function ajax(options) {
            options = _.extend({
                url: this.url(),
                headers: { "Content-Type": "application/json" },
                success: _.bind(function () {
                    this.fetch();
                }, this),
                error: _.bind(function (xhr) {
                    if (xhr.status !== 404) {
                        this.handleErrorResponse(xhr, formatter.I18n.getText("issue.operations.watching.add.error"));
                    }
                }, this)
            }, options);
            return $.ajax(options);
        },

        getUser: function getUser(username) {
            return $.ajax({
                url: contextPath() + "/rest/api/2/user?username=" + encodeURIComponent(username),
                error: _.bind(function (xhr) {
                    if (xhr.status !== 404) {
                        this.handleErrorResponse(xhr, formatter.I18n.getText("issue.operations.watching.add.error"));
                    }
                }, this)
            });
        },

        handleErrorResponse: function handleErrorResponse(xhr, msg) {
            var errorCollection = this._parseResponse(xhr.responseText);
            if (errorCollection.errorMessages) {
                var html = TEMPLATES.error({
                    msg: msg,
                    errors: errorCollection.errorMessages
                });
                Messages.showErrorMsg(html, {
                    closeable: true
                });
            }
            this.trigger("errorOccurred");
        },

        _parseResponse: function _parseResponse(responseText) {
            try {
                return JSON.parse(responseText);
            } catch (e) {
                // parse JSON failed
                this._showFatalErrorMessage();
                return null;
            }
        },

        _showFatalErrorMessage: function _showFatalErrorMessage() {
            // TODO: would be nice to extract this error from smartAjax and make it uniform in JIRA
            var msg = '<p>' + formatter.I18n.getText("common.forms.ajax.error.dialog.heading") + '</p>' + '<p>' + formatter.I18n.getText("common.forms.ajax.error.dialog") + '</p>';
            Messages.showErrorMsg(msg, {
                closeable: true
            });
        }
    });
});
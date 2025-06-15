require(['jira/urlParamFlag', 'jira/util/init-on-dcl', 'jira/util/formatter'], function (UrlParamFlag, initOnDCL, formatter) {
    'use strict';

    var DELETED_CONTEXT = 'deletedContext';
    var CREATED_CONTEXT = 'createdContext';
    var UPDATED_CONTEXT = 'updatedContext';
    var MessageType = UrlParamFlag.MessageType;

    initOnDCL(function () {
        var urlParamFlag = new UrlParamFlag(location.href, [{
            parameterName: DELETED_CONTEXT,
            getMessage: function getMessage(escapedValue) {
                return formatter.I18n.getText('admin.issuefields.config.context.deleted.flag', escapedValue, '<strong>', '</strong>');
            }
        }, {
            parameterName: UPDATED_CONTEXT,
            getMessage: function getMessage(escapedValue) {
                return formatter.I18n.getText('admin.issuefields.config.context.updated.flag', escapedValue, '<strong>', '</strong>');
            }
        }, {
            parameterName: CREATED_CONTEXT,
            getMessage: function getMessage(escapedValue) {
                return formatter.I18n.getText('admin.issuefields.config.context.created.flag', escapedValue, '<strong>', '</strong>');
            },
            type: MessageType.SUCCESS
        }]);

        urlParamFlag.show();
    });
});
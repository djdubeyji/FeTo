/**
 * Utility class used to display flags based on the parameters in the url.
 * @example
 * Given current url eg. http://www.jira.test/?parameter1=value1&parameter3=value3&parameter4=value4
 * and i18n properties:
 * i18n.message.1 = Hello1 {0}
 * i18n.message.2 = Hello2 {0}
 * i18n.message.3 = Hello3 {0}
 * the following code:
 *
 * const urlParamFlag = new UrlParamFlag(location.href, [
 * {
 *    parameterName: 'parameter1',
 *    getMessage: (escapedValue) => formatter.I18n.getText('i18n.message.1', escapedValue)
 *},
 * {
 *    parameterName: 'parameter2',
 *    getMessage: (escapedValue) => formatter.I18n.getText('i18n.message.2', escapedValue)
 *},
 * {
 *    parameterName: 'parameter3',
 *    getMessage: (escapedValue) => formatter.I18n.getText('i18n.message.3', escapedValue),
 *    type: 'success'
 *},
 * ]);
 *
 * urlParamFlag.show();
 *
 * should render 2 flags:
 * - "info" flag with i18n message "Hello1 value1"
 * - "success" flag with i18n message "Hello3 value3"
 *
 * Processed parameters are removed from browser url so the browser url should be updated to:
 * http://www.jira.test/?parameter4=value4
 */
define('jira/urlParamFlag', ['underscore', 'jira/flag'], function (_, Flag) {
    'use strict';

    var MessageType = {
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info',
        SUCCESS: 'success'
    };

    /**
     * @function getMessageFunction
     * @param {string} encodedParameterValue - encoded parameter value parsed from the url
     * @returns {string} flag message
     */
    /**
     * Constructs UrlParamFlag.
     *
     * @constructor
     * @param {string} hrefString - href string to parse for parameters. Defaults to window.location.href if not passed.
     * @param {Object[]} flagsData - Flags data.
     * @param {string} flagsData[].parameterName - Name of url parameter to search for.
     * @param {string} flagsData[].type - Type of flag.
     * @param {getMessageFunction} flagsData[].getMessage - The name of an employee.
     */
    var UrlParamFlag = function UrlParamFlag(hrefString, flagsData) {
        this.hrefString = hrefString || window.location.href;
        this.url = new URL(this.hrefString);
        this.flagsData = flagsData || [];
    };

    /**
     * Processed the URL against configured flagsData, shows flags and removes processed parameters from browser url.
     */
    UrlParamFlag.prototype.show = function () {
        this._handleFlags(this.url.pathname, this.url.search);
    };

    UrlParamFlag.prototype._handleFlags = function (pathname, search) {
        var params = search || '';
        if (params.startsWith('?')) {
            params = params.substr(1);
        }
        var urlSearchParams = new URLSearchParams(params);

        this.flagsData.forEach(function (flagData) {
            var paramValue = urlSearchParams.get(flagData.parameterName);
            if (paramValue) {
                var message = flagData.getMessage(_.escape(paramValue));
                var type = flagData.type || 'info';

                Flag.showMsg(null, message, {
                    closeable: true,
                    close: 'auto',
                    type: type
                });
                if (window.history.replaceState) {
                    urlSearchParams.delete(flagData.parameterName);
                    var url = (pathname || '') + '?' + urlSearchParams.toString();
                    window.history.replaceState(null, null, url);
                }
            }
        }.bind(this));
    };

    UrlParamFlag.MessageType = MessageType;

    return UrlParamFlag;
});
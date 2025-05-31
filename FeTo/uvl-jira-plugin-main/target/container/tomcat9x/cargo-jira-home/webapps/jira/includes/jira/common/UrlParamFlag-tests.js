AJS.test.require(['jira.webresources:urlParamFlag'], function () {
    'use strict';

    var getMessageMock = function getMessageMock(parameter) {
        return "flagContent for: " + parameter;
    };

    module('UrlParamFlag', {
        setup: function setup() {
            this.flagsData = [];
            this.sandbox = sinon.sandbox.create();
            this.sandbox.stub(window.history, "replaceState");
            this.context = AJS.test.mockableModuleContext();
            this.showMsg = sinon.stub();
            this.context.mock("jira/flag", {
                showMsg: this.showMsg
            });

            this.UrlParamFlag = this.context.require('jira/urlParamFlag');
        },
        teardown: function teardown() {
            this.sandbox.restore();
        }
    });

    [{
        parameterName: 'deletedContext',
        getMessage: getMessageMock,
        url: 'http://www.test.invalid'
    }, {
        parameterName: 'deletedContext',
        getMessage: getMessageMock,
        url: 'http://www.test.invalid?'
    }, {
        parameterName: 'deletedContext',
        getMessage: getMessageMock,
        url: 'http://www.test.invalid/someContext/test?deletedContext=contextName',
        urlAfter: '/someContext/test?',
        expectedParameterValue: 'contextName'
    }, {
        parameterName: 'deletedContext',
        getMessage: getMessageMock,
        url: 'http://www.test.invalid?some=param&deletedContext=contextName&other=param2',
        urlAfter: '/?some=param&other=param2',
        expectedParameterValue: 'contextName'
    }, {
        parameterName: 'deletedContext',
        getMessage: getMessageMock,
        url: 'http://www.test.invalid?deletedContext=<script>alert(1)</script>',
        urlAfter: '/?',
        expectedParameterValue: '&lt;script&gt;alert(1)&lt;/script&gt;'
    }, {
        parameterName: 'otherParam',
        getMessage: getMessageMock,
        url: 'http://www.test.invalid?deletedContext=<script>alert(1)</script>&otherParam=<script>alert(2)</script>',
        urlAfter: '/?deletedContext=%3Cscript%3Ealert%281%29%3C%2Fscript%3E',
        expectedParameterValue: '&lt;script&gt;alert(2)&lt;/script&gt;'
    }].forEach(function (data) {
        test('should handle url ' + data.url + ' with parameter name ' + data.parameterName + ' so that expected parameter value/flag is: ' + (data.expectedParameterValue ? data.expectedParameterValue : 'not handled'), function () {
            sinon.assert.notCalled(this.showMsg);
            sinon.assert.notCalled(window.history.replaceState);

            var urlParamFlag = new this.UrlParamFlag(data.url, [data]);
            urlParamFlag.show();

            if (data.expectedParameterValue) {
                sinon.assert.calledWith(this.showMsg, null, 'flagContent for: ' + data.expectedParameterValue, {
                    closeable: true,
                    close: 'auto',
                    type: 'info'
                });
                sinon.assert.calledWith(window.history.replaceState, null, null, data.urlAfter);
            } else {
                sinon.assert.notCalled(this.showMsg);
                sinon.assert.notCalled(window.history.replaceState);
            }
        });
    });

    test('Should handle multiple flags', function () {
        var data = {
            url: 'http://test/someContext/test?param1=value1&param2=value2&param3=value3&param4=value4&param5=value5',
            urlAfter: '/someContext/test?param2=value2&param4=value4',
            flagsData: [{
                parameterName: 'param1',
                getMessage: getMessageMock,
                type: 'success'
            }, {
                parameterName: 'param222',
                getMessage: getMessageMock
            }, {
                parameterName: 'param3',
                getMessage: getMessageMock,
                type: 'warning'
            }, {
                parameterName: 'param444',
                getMessage: getMessageMock,
                type: 'info'
            }, {
                parameterName: 'param5',
                getMessage: getMessageMock
            }]

        };

        sinon.assert.notCalled(this.showMsg);
        sinon.assert.notCalled(window.history.replaceState);
        var urlParamFlag = new this.UrlParamFlag(data.url, data.flagsData);

        urlParamFlag.show();

        equal(3, this.showMsg.callCount);
        equal(3, window.history.replaceState.callCount);
        sinon.assert.calledWith(this.showMsg, null, 'flagContent for: value1', {
            closeable: true,
            close: 'auto',
            type: 'success'
        });
        sinon.assert.calledWith(window.history.replaceState, null, null, '/someContext/test?param2=value2&param3=value3&param4=value4&param5=value5');
        sinon.assert.calledWith(this.showMsg, null, 'flagContent for: value3', {
            closeable: true,
            close: 'auto',
            type: 'warning'
        });
        sinon.assert.calledWith(window.history.replaceState, null, null, '/someContext/test?param2=value2&param4=value4&param5=value5');
        sinon.assert.calledWith(this.showMsg, null, 'flagContent for: value5', {
            closeable: true,
            close: 'auto',
            type: 'info'
        });
        sinon.assert.calledWith(window.history.replaceState, null, null, '/someContext/test?param2=value2&param4=value4');
    });
});
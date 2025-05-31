AJS.test.require(["jira.webresources:jira-fields", "jira.webresources:jira-global"], function () {
    'use strict';

    var userPickerUtil = require('jira/field/user-picker-util');

    module("JIRA.UserPickerUtil");

    test("formatResponse returns correct group descriptor", function () {
        var response = userPickerUtil.formatResponse([{
            footer: 'label1',
            users: [{ name: 'name1', displayName: 'Name 1', html: '<html1>', avatarUrl: '/avatar1' }, { name: 'name2', displayName: 'Name 2', html: '<html1>', avatarUrl: '/avatar2' }]
        }]);

        equal(response.length, 1, 'Return only one GroupDescriptor');

        var groupDescriptor = response[0];
        equal(groupDescriptor.weight(), 0, 'GroupDescriptor weight should be 0');
        equal(groupDescriptor.label(), 'label1', 'GroupDescriptor label should be "label1"');
        equal(groupDescriptor.items().length, 2, 'GroupDescriptor should have 2 ItemDescriptors');

        var itemDescriptor1 = groupDescriptor.items()[0];
        equal(itemDescriptor1.label(), 'Name 1', 'First ItemDescriptor should be "Name 1"');

        var itemDescriptor2 = groupDescriptor.items()[1];
        equal(itemDescriptor2.label(), 'Name 2', 'Second ItemDescriptor should be "Name 2"');
    });

    test("formatResponseWithoutHTML returns correct group descriptor", function () {
        var data = {
            users: [{ name: 'name1', displayName: 'Name 1', emailAddress: 'email1', avatarUrl: '/avatar1' }, { name: 'name2', displayName: 'Name 2', emailAddress: 'email2', avatarUrl: '/avatar2' }]
        };
        var query = 'Na';

        var response = userPickerUtil.formatResponseWithoutHTML(data, query);

        equal(response.length, 1, 'Return only one GroupDescriptor');

        var groupDescriptor = response[0];
        equal(groupDescriptor.weight(), 0, 'GroupDescriptor weight should be 0');
        equal(groupDescriptor.label(), '', 'GroupDescriptor label should be empty');
        equal(groupDescriptor.items().length, 2, 'GroupDescriptor should have 2 ItemDescriptors');

        var itemDescriptor1 = groupDescriptor.items()[0];
        equal(itemDescriptor1.label(), 'Name 1', 'First ItemDescriptor should be "Name 1"');
        equal(itemDescriptor1.html(), '<mark>Na</mark>me 1 - email1 (<mark>na</mark>me1)', 'First ItemDescriptor HTML should be correctly formatted');

        var itemDescriptor2 = groupDescriptor.items()[1];
        equal(itemDescriptor2.label(), 'Name 2', 'Second ItemDescriptor should be "Name 2"');
        equal(itemDescriptor2.html(), '<mark>Na</mark>me 2 - email2 (<mark>na</mark>me2)', 'Second ItemDescriptor HTML should be correctly formatted');
    });

    test("formatResponseWithoutHTML escapes user display name and name", function () {
        var unescapedDisplayName = 'Nice site,  I think I\'ll take it. \x3Cscript>alert(\'Executing JS\')\x3C/script>';
        var expectedEscapedDisplayNameHTML = 'Nice <mark>site</mark>,  I think I&#x27;ll take it. &lt;script&gt;alert(&#x27;Executing JS&#x27;)&lt;/script&gt; - email2@qunit.com (Bob &lt;script&gt;alert(&#x27;Executing JS&#x27;)&lt;/script&gt;)';

        var data = {
            users: [{ name: 'Bob \x3Cscript>alert(\'Executing JS\')\x3C/script>', displayName: 'Nice site,  I think I\'ll take it. \x3Cscript>alert(\'Executing JS\')\x3C/script>', emailAddress: 'email2@qunit.com', avatarUrl: '/avatar2' }]
        };
        var query = 'site';

        var response = userPickerUtil.formatResponseWithoutHTML(data, query);

        equal(response.length, 1, 'Return only one GroupDescriptor');

        var groupDescriptor = response[0];
        equal(groupDescriptor.weight(), 0, 'GroupDescriptor weight should be 0');
        equal(groupDescriptor.label(), '', 'GroupDescriptor label should be empty');
        equal(groupDescriptor.items().length, 1, 'GroupDescriptor should have 1 ItemDescriptor');

        var itemDescriptior = groupDescriptor.items()[0];
        equal(itemDescriptior.label(), unescapedDisplayName, "First ItemDescriptor should be \"" + unescapedDisplayName + "\"");
        equal(itemDescriptior.html(), expectedEscapedDisplayNameHTML, 'First ItemDescriptor HTML should be correctly formatted');
    });

    test("getUrl returns correct URL", function (asserts) {
        var url1 = userPickerUtil.getUrl(true, false, '');
        ok(url1.includes('/rest/api/1.0/users/picker'), 'URL for custom field with feature flag turned off should be correct.');

        var url2 = userPickerUtil.getUrl(false, false, '');
        ok(url2.includes('/rest/api/2/user/picker'), 'URL for non-custom field with feature flag turned off should be correct.');

        var assertThrow = asserts['throws'];

        assertThrow(function () {
            userPickerUtil.getUrl(false, true, 'unknownPicker');
        }, 'Trying to get URL for unknown picker should throw an error.');

        var url3 = userPickerUtil.getUrl(false, true, 'reporter');

        ok(url3.includes('/rest/internal/2/users/reporter'), 'URL for reporter picker with feature flag turned on should be correct.');
    });
});
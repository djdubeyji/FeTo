var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

AJS.test.require(["jira.webresources:mentions-feature"], function () {
    'use strict';

    var MentionMatcher = require('jira/mention/mention-matcher');
    var Mentions = require('jira/mention/mention');
    var $ = require('jquery');

    var SAMPLE_USERS = [{ "self": "http://localhost:8090/jira/rest/api/2/user?username=admin", "key": "admin", "name": "admin", "emailAddress": "admin@admin.com", "avatarUrls": { "48x48": "https://www.gravatar.com/avatar/64e1b8d34f425d19e1ee2ea7236d3028?d=mm&s=48", "24x24": "https://www.gravatar.com/avatar/64e1b8d34f425d19e1ee2ea7236d3028?d=mm&s=24", "16x16": "https://www.gravatar.com/avatar/64e1b8d34f425d19e1ee2ea7236d3028?d=mm&s=16", "32x32": "https://www.gravatar.com/avatar/64e1b8d34f425d19e1ee2ea7236d3028?d=mm&s=32" }, "displayName": "admin", "active": true, "timeZone": "Australia/Sydney", "locale": "en_AU", "issueInvolvements": [{ "id": "assignee", "label": "assignee" }, { "id": "reporter", "label": "reporter" }], "highestIssueInvolvementRank": 0 }, { "self": "http://localhost:8090/jira/rest/api/2/user?username=axafirfjr", "key": "JIRAUSER10640", "name": "axafirfjr", "emailAddress": "axafirfjr@localdomain.com", "avatarUrls": { "48x48": "https://www.gravatar.com/avatar/82311ba8f074bae9ef3715290ee2136a?d=mm&s=48", "24x24": "https://www.gravatar.com/avatar/82311ba8f074bae9ef3715290ee2136a?d=mm&s=24", "16x16": "https://www.gravatar.com/avatar/82311ba8f074bae9ef3715290ee2136a?d=mm&s=16", "32x32": "https://www.gravatar.com/avatar/82311ba8f074bae9ef3715290ee2136a?d=mm&s=32" }, "displayName": "Aaflwdgu Xafirfjr", "active": true, "timeZone": "Australia/Sydney", "locale": "en_AU", "issueInvolvements": [] }, { "self": "http://localhost:8090/jira/rest/api/2/user?username=asumlnczj", "key": "JIRAUSER10624", "name": "asumlnczj", "emailAddress": "asumlnczj@localdomain.com", "avatarUrls": { "48x48": "https://www.gravatar.com/avatar/f549dbd3da17ee50c851f568ca74d05e?d=mm&s=48", "24x24": "https://www.gravatar.com/avatar/f549dbd3da17ee50c851f568ca74d05e?d=mm&s=24", "16x16": "https://www.gravatar.com/avatar/f549dbd3da17ee50c851f568ca74d05e?d=mm&s=16", "32x32": "https://www.gravatar.com/avatar/f549dbd3da17ee50c851f568ca74d05e?d=mm&s=32" }, "displayName": "Aajegmhy Sumlnczj", "active": true, "timeZone": "Australia/Sydney", "locale": "en_AU", "issueInvolvements": [] }, { "self": "http://localhost:8090/jira/rest/api/2/user?username=axmyummap", "key": "JIRAUSER11091", "name": "axmyummap", "emailAddress": "axmyummap@localdomain.com", "avatarUrls": { "48x48": "https://www.gravatar.com/avatar/0bf6ef284e3a9328e6078e9a4282e804?d=mm&s=48", "24x24": "https://www.gravatar.com/avatar/0bf6ef284e3a9328e6078e9a4282e804?d=mm&s=24", "16x16": "https://www.gravatar.com/avatar/0bf6ef284e3a9328e6078e9a4282e804?d=mm&s=16", "32x32": "https://www.gravatar.com/avatar/0bf6ef284e3a9328e6078e9a4282e804?d=mm&s=32" }, "displayName": "Aaomclxu Xmyummap", "active": true, "timeZone": "Australia/Sydney", "locale": "en_AU", "issueInvolvements": [] }, { "self": "http://localhost:8090/jira/rest/api/2/user?username=ajsvnucxf", "key": "JIRAUSER11535", "name": "ajsvnucxf", "emailAddress": "ajsvnucxf@localdomain.com", "avatarUrls": { "48x48": "https://www.gravatar.com/avatar/f491c6f658614f6609a61a36d2528b39?d=mm&s=48", "24x24": "https://www.gravatar.com/avatar/f491c6f658614f6609a61a36d2528b39?d=mm&s=24", "16x16": "https://www.gravatar.com/avatar/f491c6f658614f6609a61a36d2528b39?d=mm&s=16", "32x32": "https://www.gravatar.com/avatar/f491c6f658614f6609a61a36d2528b39?d=mm&s=32" }, "displayName": "Aarmwrzx Jsvnucxf", "active": true, "timeZone": "Australia/Sydney", "locale": "en_AU", "issueInvolvements": [] }]; // eslint-disable-line max-len
    var SEARCH_DEBOUNCE_TIME = 175;
    var QUERY = 'fred';
    var ISSUE_KEY = 'HEK-1';

    function match(text, length) {
        length || (length = text.length);
        return MentionMatcher.getUserNameFromCurrentWord(text, length);
    }

    module("getUserNameFromCurrentWord - triggers");

    test("empty searches", function () {
        equal(match("@"), "", "matching @");
        equal(match("[@"), "", "matching [@");
        equal(match("[~"), "", "matching [~");
        equal(match("[~@"), "", "matching [~@");
        equal(match('~@'), "", "matching ~@");
    });

    test("non-valid syntaxes do not trigger autocomplete", function () {
        equal(match("["), null, "matching [");
        equal(match("[a"), null, "matching [a");
    });

    test("simple search for 'a'", function () {
        equal(match("@a"), "a", "matching @a");
        equal(match("[@a"), "a", "matching [@a");
        equal(match("[~a"), "a", "matching [~a");
        equal(match("[~@a"), "a", "matching [~@a");
    });

    test("takes the last occurrence of [~ to start the search", function () {
        equal(match('[~[~['), "[", "should only return data after the last [~");
    });

    test("the @ syntax takes precedence over [~ syntax", function () {
        equal(match("[@~"), "~", "matching [@~");
        equal(match("[@~a"), "~a", "matching [@~a");
    });

    test("the @ syntax does not match if preceded by alpha-numeric characters", function () {
        equal(match("test@a"), null, "matching test@a");

        equal(match("the quick brown fox jumped over the lazy@dog"), null, "there's an alphanumeric character before the @, so shouldn't match");
        equal(match("the quick brown fox jumped over the lazy @dog"), "dog", "no alphanumeric character before the @, so should search for 'dog'");
    });

    test("the [~ syntax does not match if preceded by alpha-numeric characters", function () {
        equal(match("test[~a"), null, "matching test[~a");

        equal(match("the quick brown fox jumped over the lazy[~dog"), null, "there's an alphanumeric character before the [~, so shouldn't match");
        equal(match("the quick brown fox jumped over the lazy [~dog"), "dog", "no alphanumeric character before the [~, so should search for 'dog'");
    });

    test("the rest", function () {
        equal(match("test[@a"), "a", "matching test[@a");
        equal(match("test[@~a"), "~a", "matching test[@~a");
        equal(match("test[~@a"), "a", "matching test[~@a");

        equal(match("a test[@a"), "a", "matching a test[@a");
        equal(match("a test[@~a"), "~a", "matching a test[@~a");
        equal(match("a test[~@a"), "a", "matching a test[~@a");
    });

    module("getUserNameFromCurrentWord - query");

    test("can have multiple words in the query", function () {
        equal(match("the quick brown fox jumped over the @lazy dog"), "lazy dog", "should return 'lazy dog'");
        equal(match("the quick brown fox jumped over @the lazy dog"), "the lazy dog", "should return 'the lazy dog'");
    });

    test("the query is limited to three words maximum", function () {
        var content = "the quick brown fox @jumped over the lazy dog";
        equal(match(content, content.length), null, "caret is at end of 5th word after the @, so should return null");
        equal(match(content, content.length - 4), null, "caret is at end of 4th word after the @, so should return null");
        equal(match(content, content.length - 7), null, "caret is inside 4th word after the @, so should return null");
        equal(match(content, content.length - 9), "jumped over the", "caret is at end of 3rd word after the @, so should return 'jumped over the'");
    });

    test("the query will return multiple words up to and including any whitespace before the 4th word", function () {
        var content = "the quick brown fox @jumped over the lazy dog";
        equal(match(content, content.length - 8), "jumped over the ", "caret is just before the 4th word after the @, so should return everything before it (including the whitespace)");
        equal(match(content, content.length - 7), null, "caret is just after the 'l' in lazy, which is in the 4th word, so should return null");
    });

    test("trailing whitespace is 'preserved' in the query", function () {
        equal(match("the quick brown fox jumped over the @lazy dog  "), "lazy dog  ", "should keep the space after 'dog'");
    });

    test("infix whitespace is preserved in the query", function () {
        equal(match("jumped over the @lazy   dog"), "lazy   dog", "should keep the three spaces between 'lazy' and 'dog'");
        equal(match("jumped over the @lazy \t\t  dog"), "lazy \t\t  dog", "keeps everything between 'lazy' and 'dog'");
    });

    test("carriage return and newline break the query", function () {
        var content = "jumped over the @lazy\ndog";
        equal(match(content, content.length), null, "when the user's caret is on the next line, it returns false"); //
        equal(match(content, content.length - 3), null, "when the user's caret is just after the new line, it returns false"); //
        equal(match(content, content.length - 4), "lazy", "when the user's caret is just before the new line (i.e, just after 'lazy'), it will return 'lazy'");
    });

    module("Mention - role help text");

    function isHelpTextVisible(isRolesEnabled) {
        return !!$(JIRA.Templates.mentionsSuggestions({
            suggestions: [],
            activity: false,
            query: null,
            isRolesEnabled: isRolesEnabled
        })).find('.aui-list-section-footer').length;
    }

    test("help text should be available when roles is enabled", function () {
        ok(isHelpTextVisible(true));
    });

    test("help text should not be available when roles is not enabled", function () {
        ok(!isHelpTextVisible(false));
    });

    module("Mention#_indexOfFirstMatch");

    test("_indexOfFirstMatch", function () {
        var indexOfFirstMatch = JIRA.Mention.prototype._indexOfFirstMatch;
        equal(indexOfFirstMatch('Mike Cannon-Brooks', 'Br'), 12);
        equal(indexOfFirstMatch('Mike Cannon-Brooks', 'Bre'), -1);
        equal(indexOfFirstMatch('Mike Cannon-Brooks', 'Mi'), 0);
        equal(indexOfFirstMatch('Mike Cannon-Brooks', 'Cann'), 5);
        equal(indexOfFirstMatch('Mike Cannon-Brooks', 'Cannon-Brooks'), 5);
        equal(indexOfFirstMatch('James O\'Brian', 'Br'), 8);
        equal(indexOfFirstMatch('James O\'Brian', 'O\'Br'), 6);
        equal(indexOfFirstMatch('cat@hat.com', 'ca'), 0);
        equal(indexOfFirstMatch('cat@hat.com', 'ha'), 4);
        equal(indexOfFirstMatch('cat@hat.com', 'at'), -1);
        equal(indexOfFirstMatch('cat@hat.com', 'co'), 8);
    });

    module("Mentions component", {
        setup: function setup() {
            this.sandbox = sinon.sandbox.create();
            this.server = this.sandbox.useFakeServer();
            this.clock = this.sandbox.useFakeTimers();
        },
        teardown: function teardown() {
            this.clock.restore();
            this.server.restore();
        }
    });

    var parseQueryString = function parseQueryString(queryString) {
        return queryString.split('&').reduce(function (acc, s) {
            var _s$split = s.split('='),
                _s$split2 = _slicedToArray(_s$split, 2),
                key = _s$split2[0],
                value = _s$split2[1];

            acc[key] = value;
            return acc;
        }, {});
    };

    var getParams = function getParams(url) {
        return parseQueryString(url.split('?')[1]);
    };

    test("Debounces calls to server", function () {
        var mentions = new Mentions("HEK-1");
        var textarea = "<textarea></textarea>";
        sinon.stub(mentions, "_getMentionsOffsetTarget", function () {
            return $(textarea);
        });

        mentions.textarea(textarea);

        sinon.stub(mentions, "_getUserNameFromInput", function () {
            return "fred";
        });
        sinon.stub(mentions, "_getCaretPosition", function () {
            return 0;
        });
        sinon.stub(mentions, "_isNewRequestRequired", function () {
            return true;
        });

        mentions._keyUp();
        mentions._keyUp();
        mentions._keyUp();
        equal(this.server.requests.length, 0, "API was not called instantly");
        this.clock.tick(SEARCH_DEBOUNCE_TIME); // wait for debounce
        equal(this.server.requests.length, 1, "API was called once");
    });

    var scenarios = [{
        description: "calls proper URL when feature flag is turned off and issue key is present",
        issueKey: ISSUE_KEY,
        query: QUERY,
        featureFlag: false,
        expectedUrl: '/rest/internal/2/user/mention/search',
        urlParams: {
            issueKey: ISSUE_KEY
        }
    }, {
        description: "calls proper URL when feature flag is turned off and issue key is not present",
        query: QUERY,
        featureFlag: false,
        expectedUrl: '/rest/api/2/user/viewissue/search',
        urlParams: {
            username: QUERY
        }
    }, {
        description: "calls proper URL when feature flag is turned on and issue key is present",
        issueKey: ISSUE_KEY,
        query: QUERY,
        featureFlag: true,
        expectedUrl: '/rest/internal/2/users/mention',
        urlParams: {
            issueKey: ISSUE_KEY,
            query: QUERY
        }
    }, {
        description: "calls proper URL when feature flag is turned on and issue key is not present",
        query: QUERY,
        featureFlag: true,
        expectedUrl: '/rest/internal/2/users/mention',
        urlParams: {
            query: QUERY
        }
    }, {
        description: "calls proper URL when feature flag is turned on and multiple project keys are present",
        query: QUERY,
        featureFlag: true,
        projectKeys: 'AAA,BBB,CCC',
        expectedUrl: '/rest/internal/2/users/mention',
        urlParams: {
            query: QUERY,
            projectKeys: 'AAA%2CBBB%2CCCC'
        }
    }];

    scenarios.forEach(function (scenario) {
        test('' + scenario.description, function () {
            var mentions = new Mentions(scenario.issueKey, scenario.featureFlag);
            var textarea = '<textarea data-issuekey="' + (scenario.issueKey || '') + '" data-project-keys="' + (scenario.projectKeys || '') + '"></textarea>';
            sinon.stub(mentions, "_getMentionsOffsetTarget", function () {
                return $(textarea);
            });

            mentions.textarea(textarea);

            sinon.stub(mentions, "_getUserNameFromInput", function () {
                return scenario.query;
            });
            sinon.stub(mentions, "_getCaretPosition", function () {
                return 0;
            });
            sinon.stub(mentions, "_isNewRequestRequired", function () {
                return true;
            });

            mentions._keyUp();

            this.server.requests = [];

            this.clock.tick(SEARCH_DEBOUNCE_TIME); // wait for debounce

            var url = this.server.requests[0].url;

            ok(url.includes(scenario.expectedUrl), scenario.description + " - proper URL is used");
            equal(getParams(url).maxResults, 5, scenario.description + " - maxResults is set properly");

            Object.entries(scenario.urlParams).forEach(function (_ref) {
                var _ref2 = _slicedToArray(_ref, 2),
                    key = _ref2[0],
                    value = _ref2[1];

                equal(getParams(url)[key], value, scenario.description + (' - ' + key + ' is set properly'));
            });
        });
    });

    function getNamesFromMarkup($element) {
        return Array.from($element.find(".aui-list-item-link").map(function (i, item) {
            return $(item).attr("rel");
        }));
    }
    /**
     * Mention.js uses AUI's ProgressiveDataSet to cache results.
     * However, we want to rely on backend results to show accurate results.
     * This prevents cache from filtering out actual results or showing most of stale results.
     * This is why we rely on PDS's queryCache instead of matcher parameter.
     * Read more on: UCACHE-119
     */

    test("Uses queryCache to display results", function () {
        // JRASERVER-72633 we want to rely on backend results. Don't filter them out with matcher.
        var mentions = new Mentions("HEK-1");
        var textarea = "<textarea></textarea>";
        var QUERY = "admin";
        sinon.stub(mentions, "_getUserNameFromInput", function () {
            return QUERY;
        });
        sinon.stub(mentions, "_getCaretPosition", function () {
            return 1;
        });
        sinon.stub(mentions, "_isNewRequestRequired", function () {
            return true;
        });
        sinon.stub(mentions, "_getMentionsOffsetTarget", function () {
            return $(textarea);
        });

        var suggestionRendererSpy = sinon.spy(mentions, "updateSuggestions");
        mentions.textarea(textarea);

        equal(mentions.dataSource.matcher(), false, "matcher is not returning results");

        mentions._keyUp();
        this.clock.tick(SEARCH_DEBOUNCE_TIME); // wait for debounce
        this.sandbox.server.respondWith([200, { "Content-Type": "application/json" }, JSON.stringify(SAMPLE_USERS)]);
        this.sandbox.server.respond();
        var results = getNamesFromMarkup(suggestionRendererSpy.secondCall.args[0]);
        deepEqual(results, SAMPLE_USERS.map(function (user) {
            return user.name;
        }), "shows results in backend order");

        mentions._keyUp();
        this.clock.tick(SEARCH_DEBOUNCE_TIME); // wait for debounce
        equal(this.server.requests.length, 1, "server is not polled again for the same query");

        QUERY = "a";
        mentions._keyUp();
        this.clock.tick(SEARCH_DEBOUNCE_TIME); // wait for debounce
        equal(this.server.requests.length, 2, "server is polled even if it could populate dropdown from cache");
    });
});
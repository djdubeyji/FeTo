define('jira/mention/mention', ['jira/util/key-code', 'jira/ajs/control', 'jira/dialog/dialog-stack', 'jira/mention/mention-user', 'jira/mention/mention-group', 'jira/mention/mention-matcher', 'jira/mention/scroll-pusher', 'jira/mention/contextual-mention-analytics-event', 'jira/mention/uncomplicated-inline-layer', 'jira/ajs/layer/inline-layer/standard-positioning', 'jira/ajs/layer/inline-layer/window-positioning', 'jira/ajs/dropdown/dropdown-list-item', 'jira/util/events', 'aui/progressive-data-set', 'jquery', 'underscore', 'wrm/context-path', 'jira/util/logger'], function (keyCodes, Control, DialogStack, UserModel, MentionGroup, MentionMatcher, jiraScrollPusher, ContextualMentionAnalyticsEvent, UncomplicatedInlineLayer, InlineLayerStandardPositioning, InlineLayerWindowPositioning, DropdownListItem, Events, ProgressiveDataSet, jQuery, _, contextPath, logger) {
    "use strict";

    var SEARCH_DEBOUNCE_TIME = 175;
    var SEARCH_MAX_RESULTS = 5;

    var mentioning = false;
    var seedData = {};

    /**
     * Gets the specified attribute from an HTML element.
     * @param {jQuery|HTMLElement} element
     * @param {String} attribute - name of the attribute
     */
    function attributeOf(element, attribute) {
        var ret = '';
        var el;
        if (element) {
            el = element instanceof jQuery ? element.get(0) : element;
            ret = el.querySelector('a').getAttribute(attribute);
        }
        return ret;
    }

    function idOf(element) {
        return attributeOf(element, 'rel');
    }

    function isMentioning() {
        return mentioning;
    }

    function comparator(a, b) {
        var result = compareMaybeUndefined(a.get('highestIssueInvolvementRank'), b.get('highestIssueInvolvementRank'), function (a, b) {
            return a - b;
        });

        if (result === 0) {
            result = compareMaybeUndefined(a.get('latestCommentCreationTime'), b.get('latestCommentCreationTime'),
            // We negate the comparator result because we want descending
            // time ordering and the default is ascending
            function (a, b) {
                return b - a;
            });

            if (result === 0) {
                result = a.get('displayName').localeCompare(b.get('displayName'));
            }
        }

        return result;
    }

    // Compares two values which may or may not be undefined
    function compareMaybeUndefined(a, b, comparator) {
        if (a !== undefined) {
            return b !== undefined ? comparator(a, b) : -1;
        } else {
            return b !== undefined ? 1 : 0;
        }
    }

    function isRolesEnabled(issueKey) {
        return !!issueKey;
    }

    /**
     * Chooses the appropriate REST endpoint for retrieving mentionable users
     * based on a few static criterion.
     *
     * @param {String} [issueKey] the key for the issue. If empty, assumes no issue exists,
     * which means we fall back to a generic list of users with a browse permission.
     * @param {boolean} [useNewEndpoint] if true, users will be fetched using new endpoint that
     * does not take Browser Users permissions into account. See: MNSTR-6896
     *
     * @returns {Object} the URL the mention controller should hit.
     */
    function getDataSourceConfig(issueKey, useNewEndpoint) {
        var config = {
            model: UserModel,
            comparator: comparator,
            queryEndpoint: getUrl(issueKey, useNewEndpoint),
            queryParamKey: getQueryParamKey(issueKey, useNewEndpoint)
        };

        return config;
    }

    function getUrl(issueKey, useNewEndpoint) {
        if (useNewEndpoint) {
            return contextPath() + '/rest/internal/2/users/mention';
        }

        if (isRolesEnabled(issueKey)) {
            return contextPath() + '/rest/internal/2/user/mention/search';
        } else {
            return contextPath() + '/rest/api/2/user/viewissue/search';
        }
    }

    function getQueryParamKey(issueKey, useNewEndpoint) {
        if (useNewEndpoint) {
            return 'query';
        }

        if (isRolesEnabled(issueKey)) {
            return "query";
        } else {
            return "username";
        }
    }

    /**
     * Provides autocomplete for username mentions in textareas.
     *
     * @class Mention
     * @extends Control
     */
    return Control.extend({

        CLASS_SIGNATURE: "AJS_MENTION",

        lastInvalidUsername: "",

        lastRequestMatch: true,

        lastValidUsername: "",

        init: function init(issueKey, useNewEndpoint) {
            // true if com.atlassian.jira.ignoreBrowseUsersPermissionsInUserPickers feature flag is turned on
            this.useNewEndpoint = useNewEndpoint;
            var config = getDataSourceConfig(issueKey, useNewEndpoint);

            this.listController = new MentionGroup();
            this.isRolesEnabled = isRolesEnabled(issueKey);

            this.dataSource = new ProgressiveDataSet([], _.extend({
                queryData: this._getQueryParams.bind(this),
                matcher: function matcher() {
                    return false;
                } // Use only queryCache
            }, config));

            // perform AJAX calls even if enough of items is in cache to satisfy SEARCH_MAX_RESULTS
            this.dataSource.shouldGetMoreResults = function () {
                return true;
            };

            // UCACHE-31 debounce costly calls to API
            this.fetchUserNames = _.debounce(this.dataSource.query, SEARCH_DEBOUNCE_TIME);

            this.dataSource.bind('respond', function (response) {
                var _this = this;

                var username = response.query;

                if (!username) {
                    return;
                }

                if (!isMentioning()) {
                    return;
                }

                var results = this.dataSource.findQueryCache(username) || [];
                var suggestions = results.slice(0, SEARCH_MAX_RESULTS).filter(function (name) {
                    return name;
                }).map(function (name) {
                    return _this.dataSource.findWhere({
                        name: name
                    });
                });

                // Update the state of mentions matches
                if (!suggestions.length) {
                    if (!this.lastInvalidUsername || username.length <= this.lastInvalidUsername.length) {
                        this.lastInvalidUsername = username;
                    }
                    this.lastRequestMatch = false;
                } else {
                    this.lastInvalidUsername = "";
                    this.lastValidUsername = username;
                    this.lastRequestMatch = true;
                }

                // Set the results
                var $suggestions = this.generateSuggestions(suggestions, username);
                this.updateSuggestions($suggestions);
                logger.trace("mention.suggestions.updated");
            }.bind(this));

            this.dataSource.bind('activity', function (response) {
                if (response.activity) {
                    this.layerController._showLoading();
                } else {
                    this.layerController._hideLoading();
                }
            }.bind(this));
        },

        updateSuggestions: function updateSuggestions($suggestions) {
            var _this2 = this;

            if (this.layerController) {
                requestAnimationFrame(function () {
                    _this2.layerController.content($suggestions);
                    _this2.layerController.show();
                    _this2.layerController.refreshContent();
                });
            }
        },

        _getQueryParams: function _getQueryParams() {
            return this.restParams;
        },

        _getIssueKey: function _getIssueKey() {
            return this.$textarea.attr("data-issuekey");
        },

        _getProjectKey: function _getProjectKey() {
            return this.$textarea.attr("data-projectkey");
        },

        _getMultipleProjectKeys: function _getMultipleProjectKeys() {
            return this.$textarea.attr('data-project-keys');
        },

        _setQueryParams: function _setQueryParams() {
            var params = {
                maxResults: SEARCH_MAX_RESULTS
            };

            var isInCreateDialogIssueContext = DialogStack.current && DialogStack.current.options.id === "create-issue-dialog";

            if (!this.useNewEndpoint) {
                params.issueKey = isInCreateDialogIssueContext ? undefined : this._getIssueKey();
                params.projectKey = this._getProjectKey();

                this.restParams = params;
                return;
            }

            // This is truthy if we are in multiple projects context, e.g. bulk edit
            var isInMultipleProjectsContext = this._getMultipleProjectKeys();

            if (isInMultipleProjectsContext) {
                params.projectKeys = this._getMultipleProjectKeys();
            } else if (this.isRolesEnabled) {
                params.includeInvolvement = true;
                params.issueKey = isInCreateDialogIssueContext ? undefined : this._getIssueKey();
            } else {
                params.projectKeys = this._getProjectKey();
            }

            this.restParams = params;
        },

        /**
         * Creates a custom event for follow-scroll attribute.
         * This custom event will call setPosition() when the element referenced in "textarea[follow-scroll]" attribute
         *
         * @param customEvents
         * @returns {*}
         * @private
         */
        _composeCustomEventForFollowScroll: function _composeCustomEventForFollowScroll(customEvents) {
            customEvents = customEvents || {};
            var followScroll = this.$textarea.attr("follow-scroll");
            if (followScroll && followScroll.length) {
                customEvents[followScroll] = {
                    "scroll": function scroll() {
                        this.setPosition();
                    }
                };
            }
            return customEvents;
        },

        _getMentionsOffsetTarget: function _getMentionsOffsetTarget() {
            try {
                var editorAPI = this._getEditorAPI();
                var phantomCaret = editorAPI && editorAPI.phantomCaret.queryPhantomCaretInDOM();
                // If for some reason the DOM element following the caret is not present, fallback to rendering mentions under textarea
                return phantomCaret ? jQuery(phantomCaret) : this.$textarea;
            } catch (err) {
                console.error(err);

                return this.$textarea;
            }
        },

        textarea: function textarea(_textarea) {
            var instance = this;

            if (!_textarea) {
                return this.$textarea;
            }

            this.$textarea = jQuery(_textarea);

            jQuery("#mentionDropDown").remove();

            if (this.$textarea.attr("push-scroll")) {
                /**
                 * If we are pushing the scroll, force the layer to use standard positioning. Otherwise
                 * it might end using {@see WindowPositioning} that conflicts with the intention of
                 * pushing scroll
                 */
                var positioningController = new InlineLayerStandardPositioning();
                var scrollPusher = jiraScrollPusher(this.$textarea, 10);
            }

            var windowPosController = new InlineLayerWindowPositioning();
            windowPosController.setInversePositioningIfNotFit(true);

            this.layerController = new UncomplicatedInlineLayer({
                offsetTarget: this._getMentionsOffsetTarget(),
                allowDownsize: true,
                positioningController: positioningController || windowPosController, // Will be undefined if no push-scroll, that is ok
                customEvents: this._composeCustomEventForFollowScroll(),

                /**
                 * Allows for shared object between comment boxes.
                 *
                 * Closure returns the width of the focused comment form.
                 * This comes into effect on the View Issue page where the top and
                 * bottom comment textareas are the same element moved up and down.
                 * @ignore
                 */
                width: function width() {
                    return instance.$textarea.width();
                }
            });

            this.layerController.bind("showLayer", function () {
                // Binds events to handle list navigation
                instance.listController.trigger("focus");
                instance._assignEvents("win", window);
            }).bind("hideLayer", function () {
                // Unbinds events to handle list navigation
                instance.listController.trigger("blur");
                instance._unassignEvents("win", window);

                // Try to reset the scroll
                if (scrollPusher) {
                    scrollPusher.reset();
                }
            }).bind("contentChanged", function () {
                if (!instance.layerController.$content) {
                    return;
                }

                var oldSelectedItemIndex = instance.listController.index;
                var oldSelectedItem = instance.listController.highlighted || instance.listController.items[oldSelectedItemIndex];
                var oldId = oldSelectedItem ? idOf(oldSelectedItem.$element) : '';
                var newSelectedItem;

                instance.listController.removeAllItems();
                instance.layerController.$content.off('click.jiraMentions');
                instance.layerController.$content.on('click.jiraMentions', 'li', function (e) {
                    var li = e.currentTarget;
                    instance._acceptSuggestion(li);
                    e.preventDefault();
                });
                instance.layerController.$content.find("li").each(function () {
                    var li = this;
                    var id = idOf(li);

                    var ddItem = new DropdownListItem({
                        element: li,
                        autoScroll: true
                    });
                    if (id === oldId) {
                        newSelectedItem = ddItem;
                    }
                    instance.listController.addItem(ddItem);
                });
                instance.listController.prepareForInput();
                if (newSelectedItem) {
                    newSelectedItem.trigger('focus');
                } else {
                    instance.listController.shiftFocus(0);
                }
            }).bind("setLayerPosition", function (event, positioning, inlineLayer) {
                if (DialogStack.current && DialogStack.current.$form) {
                    var buttonRow = DialogStack.current.$popup.find(".buttons-container:visible");
                    if (buttonRow.length && positioning.top > buttonRow.offset().top) {
                        positioning.top = buttonRow.offset().top;
                    }
                }

                if (positioning.left < 0) {
                    positioning.left = 0;
                }

                if (positioning.left + inlineLayer.layer().width() > jQuery(window).width()) {
                    positioning.left = Math.max(jQuery(window).width() - inlineLayer.layer().width(), 0);
                }

                // Try to make the scroll element bigger so we have room for rendering the layer
                if (scrollPusher) {
                    scrollPusher.push(positioning.top + inlineLayer.layer().outerHeight(true));
                }
            });

            this.layerController.layer().attr("id", "mentionDropDown");

            this._assignEvents("inlineLayer", instance.layerController.layer());
            this._assignEvents("textarea", instance.$textarea);

            this._setQueryParams();

            this._seedData().then(function (data) {
                var users = [];
                users.push.apply(users, data);
                instance.dataSource.add(users);
            });
        },

        /**
         * Generates autocomplete suggestions for usernames from the server response.
         * @param data The server response.
         * @param  {string} username The selected username
         * @param {boolean} [noQuery=false] if there's no query
         */
        generateSuggestions: function generateSuggestions(data, username, noQuery) {
            var highlight = function (text) {
                var result = {
                    text: text
                };

                if (!noQuery) {
                    if (text && text.length) {
                        var matchStart = this._indexOfFirstMatch(text.toLowerCase(), username.toLowerCase());
                        if (matchStart !== -1) {
                            var matchEnd = matchStart + username.length;
                            result = {
                                prefix: text.substring(0, matchStart),
                                match: text.substring(matchStart, matchEnd),
                                suffix: text.substring(matchEnd)
                            };
                        }
                    }
                }
                return result;
            }.bind(this);

            var filteredData = _.map(data, function (model) {
                var user = model.toJSON();
                user.username = user.name;
                user.displayName = highlight(user.displayName);
                user.name = highlight(user.name);
                user.iconType = 'rounded';
                user.issueRoles = _.map(user.roles, function (role) {
                    return highlight(role.label);
                });
                return user;
            });

            return jQuery(JIRA.Templates.mentionsSuggestions({
                suggestions: filteredData,
                query: username,
                activity: this.dataSource.activeQueryCount > 0,
                isRolesEnabled: this.isRolesEnabled,
                useDefaultAvatar: this.useNewEndpoint
            }));
        },

        _indexOfFirstMatch: function _indexOfFirstMatch(text, query) {
            // Separators copied from:
            // com.atlassian.jira.bc.user.search.UserSearchUtilities.SEPARATORS
            var separators = / |@|\.|-|"|,|'|\(/;
            var index = 0;
            var _i;
            while (_i !== -1) {
                if (text.indexOf(query) === 0) {
                    return index;
                }

                _i = text.search(separators);
                // If no separator found, then we've searched all the parts and the
                // query isn't matched
                if (_i === -1) {
                    return -1;
                }

                index = index + _i + 1;
                text = text.substring(_i + 1);
            }
        },

        _seedData: function getSeedData() {
            var resolution;
            var issueKey = this._getQueryParams().issueKey;
            if (issueKey) {
                if (!seedData[issueKey]) {
                    seedData[issueKey] = jQuery.ajax({
                        method: 'GET',
                        url: '' + contextPath() + (this.useNewEndpoint ? '/rest/internal/2/users/mention' : '/rest/internal/2/user/mention/search'),
                        data: this._getQueryParams(),
                        dataType: 'json',
                        contentType: 'application/json; charset=UTF-8'
                    });
                }
                resolution = seedData[issueKey].promise();
            } else {
                resolution = new jQuery.Deferred().reject();
            }
            return resolution;
        },

        /**
         * Triggered when a user clicks on or presses enter on a highlighted username entry.
         *
         * The username value is stored in the rel attribute
         *
         * @param li The selected element.
         */
        _acceptSuggestion: function _acceptSuggestion(li) {
            this._hide();
            ContextualMentionAnalyticsEvent.fireUserMayAcceptSuggestionByUsingContextualMentionEvent(this._getCurrentUserName());
            this._replaceCurrentUserName(idOf(li), attributeOf(li, 'data-displayname'));
            this.listController.removeAllItems();
            mentioning = false;
        },

        /**
         * Heavy-handed method to insert the selected user's username.
         *
         * Replaces the keyword used to search for the selected user with the
         * selected user's username.
         *
         * If a user is searched for with wiki-markup, the wiki-markup is replaced
         * with the @format mention.
         *
         * @param selectedUserName The username of the selected user.
         */
        _replaceCurrentUserName: function _replaceCurrentUserName(selectedUserName) {
            var raw = this._rawInputValue();
            var caretPos = this._getCaretPosition();
            var beforeCaret = raw.substr(0, caretPos);
            var wordStartIndex = MentionMatcher.getLastWordBoundaryIndex(beforeCaret, true);

            var before = raw.substr(0, wordStartIndex + 1).replace(/\r\n/g, "\n");
            var username = "[~" + selectedUserName + "]";
            var after = raw.substr(caretPos);

            this._rawInputValue([before, username, after].join(""));
            this._setCursorPosition(before.length + username.length);
        },

        /**
         * Sets the cursor position to the specified index.
         *
         * @param index The index to move the cursor to.
         */
        _setCursorPosition: function _setCursorPosition(index) {
            var input = this.$textarea.get(0);
            if (input.setSelectionRange) {
                input.focus();
                input.setSelectionRange(index, index);
            } else if (input.createTextRange) {
                var range = input.createTextRange();
                range.collapse(true);
                range.moveEnd('character', index);
                range.moveStart('character', index);
                range.select();
            }
        },

        /**
         * Returns the position of the cursor in the textarea.
         */
        _getCaretPosition: function _getCaretPosition() {

            var element = this.$textarea.get(0);
            var rawElementValue = this._rawInputValue();
            var caretPosition;
            var range;
            var offset;
            var normalizedElementValue;
            var elementRange;

            if (typeof element.selectionStart === "number") {
                return element.selectionStart;
            }

            if (document.selection && element.createTextRange) {
                range = document.selection.createRange();
                if (range) {
                    elementRange = element.createTextRange();
                    elementRange.moveToBookmark(range.getBookmark());

                    if (elementRange.compareEndPoints("StartToEnd", element.createTextRange()) >= 0) {
                        return rawElementValue.length;
                    } else {
                        normalizedElementValue = rawElementValue.replace(/\r\n/g, "\n");
                        offset = elementRange.moveStart("character", -rawElementValue.length);
                        caretPosition = normalizedElementValue.slice(0, -offset).split("\n").length - 1;
                        return caretPosition - offset;
                    }
                } else {
                    return rawElementValue.length;
                }
            }
            return 0;
        },

        /**
         * Gets or sets the text value of our input via the browser, not jQuery.
         * @return The precise value of the input element as provided by the browser (and OS).
         * @private
         */
        _rawInputValue: function _rawInputValue() {
            var el = this.$textarea.get(0);
            if (typeof arguments[0] === "string") {
                el.value = arguments[0];
            }
            return el.value;
        },

        /**
         * Returns the current username search key.
         */
        _getCurrentUserName: function _getCurrentUserName() {
            return this.currentUserName;
        },

        /**
         * Hides the autocomplete dropdown.
         */
        _hide: function _hide() {
            this.layerController.hide();
        },

        /**
         * Shows the autocomplete dropdown.
         */
        _show: function _show() {
            this.layerController.show();
        },

        /**
         * Key up listener.
         *
         * Figure out what our input is, then if we need to, get some suggestions.
         */
        _keyUp: function _keyUp() {
            var caret = this._getCaretPosition();
            var u = this._getUserNameFromInput(caret);
            var username = jQuery.trim(u || "");
            if (this._isNewRequestRequired(username)) {
                this.fetchUserNames(username);
                mentioning = true;
            } else if (this._showHintSuggestions(u)) {
                var data = this.dataSource.first(SEARCH_MAX_RESULTS);
                var $suggestions = this.generateSuggestions(data, username, true);
                this.updateSuggestions($suggestions);
                mentioning = true;
            } else if (!this._keepSuggestWindowOpen(username)) {
                this._hide();
                mentioning = false;
            }
            this.lastQuery = username;
            delete this.willCheck;
        },

        /**
         * @return {Boolean} true if we have suggestions and hints to show the user
         */
        _showHintSuggestions: function _showHintSuggestions(username) {
            return typeof username === 'string' && username.length === 0;
        },

        /**
         *  Checks if suggest window should be open
         * @return {Boolean}
         */
        _keepSuggestWindowOpen: function _keepSuggestWindowOpen(username) {
            if (!username) {
                return false;
            }
            if (this.layerController.isVisible()) {
                return this.dataSource.activeQueryCount || this.lastRequestMatch;
            }
            return false;
        },

        /**
         * Checks if server poll for user names is needed
         * @param username
         * @return {Boolean}
         */
        _isNewRequestRequired: function _isNewRequestRequired(username) {
            if (!username) {
                return false;
            }
            username = jQuery.trim(username);
            if (username === this.lastQuery) {
                return false;
            } else if (this.lastInvalidUsername) {
                // We use indexOf instead of stringPartStartsWith here, because we want to check the whole input, not parts.
                //Do not do a new request if they have continued typing after typing an invalid username.
                if (username.indexOf(this.lastInvalidUsername) === 0 && this.lastInvalidUsername.length < username.length) {
                    return false;
                }
            } else if (!this.lastRequestMatch && username === this.lastValidUsername) {
                return true;
            }

            return true;
        },

        /**
         * Gets the username which the caret is currently next to from the textarea's value.
         *
         * WIKI markup form is matched, and then if nothing is found, @format.
         */
        _getUserNameFromInput: function _getUserNameFromInput(caret) {
            if (typeof caret !== "number") {
                caret = this._getCaretPosition();
            }
            this.currentUserName = MentionMatcher.getUserNameFromCurrentWord(this._rawInputValue(), caret);

            return this.currentUserName;
        },

        _getEditorAPI: function _getEditorAPI() {
            try {
                return require('wiki-edit/api');
            } catch (err) {
                return null;
            }
        },

        _events: {
            win: {
                resize: function resize() {
                    this.layerController.setWidth(this.$textarea.width());
                }
            },
            textarea: {
                /**
                 * Makes a check to update the suggestions after the field's value changes.
                 *
                 * Prevents the blurring of the field or closure of a dialog when the drop down is visible.
                 *
                 * Also takes into account IE removing text from an input when escape is pressed.
                 *
                 * When in a dialog, the general convention is that when escape is pressed when focused on an
                 * input the dialog will close immediately rather then just unfocus the input. We follow this convetion
                 * here.
                 *
                 * Please don't hurt me for using stopPropagation.
                 *
                 * @param e The key down event.
                 */
                "keydown": function keydown(e) {
                    if (e.keyCode === keyCodes.ESCAPE) {
                        if (this.layerController.isVisible()) {

                            if (DialogStack.current) {
                                Events.one("Dialog.beforeHide", function (e) {
                                    e.preventDefault();
                                });
                            }

                            this.$textarea.one("keyup", function (keyUpEvent) {
                                if (keyUpEvent.keyCode === keyCodes.ESCAPE) {
                                    keyUpEvent.stopPropagation(); // Prevent unfocusing the input when esc is pressed
                                    Events.trigger("Mention.afterHide");
                                }
                            });
                        }
                    } else if (!this.willCheck) {
                        //Only trigger keyUp if the key is not ESCAPE
                        this.willCheck = _.defer(_.bind(this._keyUp, this));
                        _.defer(_.bind(function () {
                            var username = this._getUserNameFromInput(this._getCaretPosition());
                            ContextualMentionAnalyticsEvent.fireContextualMentionIsBeingLookedUpAnalyticsEvent(username, e.keyCode, e.ctrlKey, e.metaKey);
                        }, this));
                    }
                },

                "focus": function focus() {
                    this._keyUp();
                },

                "mouseup": function mouseup() {
                    this._keyUp();
                },

                /**
                 * Prevents a bug where another inline layer will focus on comment textarea when
                 * an item in it is selected (quick admin search).
                 */
                "blur": function blur() {
                    this.listController.removeAllItems();
                    this.lastQuery = this.lastValidUsername = this.lastInvalidUsername = "";
                }
            },

            inlineLayer: {

                /**
                 * JRADEV-21950
                 * Prevents the blurring of the textarea when the InlineLayer is clicked;
                 */
                mousedown: function mousedown(e) {
                    e.preventDefault();
                }
            }
        }
    });
});

define('jira/mention/mention-user', ['jira/backbone-1.3.3', 'underscore'], function (Backbone, _) {
    'use strict';

    return Backbone.Model.extend({
        idAttribute: "name",
        initialize: function initialize() {
            this.on('change:issueInvolvements', function (model, val) {
                var involvements = _.union(model.previous('issueInvolvements'), val);
                model.attributes.issueInvolvements = _.uniq(involvements, false, function (item) {
                    return item.id;
                });
            });
        },
        parse: function parse(resp) {
            if (!resp.issueInvolvements) {
                resp.issueInvolvements = [];
            }
            return resp;
        },
        toJSON: function toJSON() {
            var data = _.clone(this.attributes);
            data.roles = data.issueInvolvements;
            delete data.issueInvolvements;
            return data;
        }
    });
});

define('jira/mention/mention-matcher', ['jquery'], function (jQuery) {
    'use strict';

    return {

        AT_USERNAME_START_REGEX: /^@(.*)/i,
        AT_USERNAME_REGEX: /[^\[]@(.*)/i,
        WIKI_MARKUP_REGEX: /\[[~@]+([^~@]*)/i,
        ACCEPTED_USER_REGEX: /\[~[^~\]]*\]/i,
        WORD_LIMIT: 3,

        /**
         * Searches a string for a mention. Searching starts at the caret position
         * and works backwards until it finds a mention trigger (e.g., the '@' symbol).
         * @param text - the full text to search
         * @param caretPosition - position of the caret, or the point at which to start looking from
         * @returns {String|null} a string value if there's a valid mention between the caret and
         * a mention trigger, or null if no mention is active (e.g., no mention trigger, or caret
         * is before the mention trigger, etc.)
         */
        getUserNameFromCurrentWord: function getUserNameFromCurrentWord(text, caretPosition) {
            var before = text.substr(0, caretPosition);
            var lastWordStartIndex = this.getLastWordBoundaryIndex(before, false);
            var prevChar = before.charAt(lastWordStartIndex - 1);
            var currentWord;
            var foundMatch = null;

            if (!prevChar || !/\w/i.test(prevChar)) {
                currentWord = this._removeAcceptedUsernames(before.substr(lastWordStartIndex));
                if (/[\r\n]/.test(currentWord)) {
                    return null;
                }

                jQuery.each([this.AT_USERNAME_START_REGEX, this.AT_USERNAME_REGEX, this.WIKI_MARKUP_REGEX], function (i, regex) {
                    var match = regex.exec(currentWord);
                    if (match) {
                        foundMatch = match[1];
                        return false;
                    }
                });
            }

            return foundMatch != null && this.lengthWithinLimit(foundMatch, this.WORD_LIMIT) ? foundMatch : null;
        },

        lengthWithinLimit: function lengthWithinLimit(input, length) {
            var parts = jQuery.trim(input).split(/\s+/);
            return parts.length <= ~~length;
        },

        getLastWordBoundaryIndex: function getLastWordBoundaryIndex(text, strip) {
            var lastAt = text.lastIndexOf("@");
            var lastWiki = text.lastIndexOf("[~");

            if (strip) {
                lastAt = lastAt - 1;
                lastWiki = lastWiki - 1;
            }

            return lastAt > lastWiki ? lastAt : lastWiki;
        },

        _removeAcceptedUsernames: function _removeAcceptedUsernames(phrase) {
            var match = this.ACCEPTED_USER_REGEX.exec(phrase);

            if (match) {
                return phrase.split(match)[1];
            } else {
                return phrase;
            }
        }
    };
});

define('jira/mention/scroll-pusher', ['jquery'], function (jQuery) {
    'use strict';

    return function ($el, defaultMargin) {
        defaultMargin = defaultMargin || 0;

        var $scroll = jQuery($el.attr("push-scroll"));
        var originalScrollHeight;

        /**
         * Push the scroll of $scroll element to make room for inlineLayer
         * @param layerBottom {number} Bottom position of the layer (relative to the page)
         * @param margin {number} Extra space to left between layer and scroll
         */
        function push(layerBottom, margin) {
            if (typeof margin === "undefined") {
                margin = defaultMargin;
            }
            var scrollBottom = $scroll.offset().top + $scroll.outerHeight();
            var overflow = layerBottom - scrollBottom;

            if (overflow + margin > 0) {
                if (!originalScrollHeight) {
                    originalScrollHeight = $scroll.height();
                }
                $scroll.height($scroll.height() + overflow + margin);
            }
        }

        /**
         * Resets the scroll
         */
        function reset() {
            if (originalScrollHeight) {
                $scroll.height(originalScrollHeight);
            }
        }

        return {
            push: push,
            reset: reset
        };
    };
});

define('jira/mention/contextual-mention-analytics-event', ['jira/util/key-code', 'jira/analytics', 'underscore'], function (keyCodes, analytics, _) {
    'use strict';

    var isBackSpacePressed = function isBackSpacePressed(keyCode) {
        return keyCode === keyCodes.BACKSPACE;
    };

    var isSelectAllOperationPerforming = function isSelectAllOperationPerforming(keyCode, ctrlKey, metaKey) {
        return keyCode === 'A'.charCodeAt() && (ctrlKey || metaKey) || ctrlKey || metaKey;
    };

    var USER_IS_LOOKING_FOR_CONTEXTUAL_MENTION_REGEX = /^(assi(gnee?)|repo(rter?))$/;
    var contextualMentionIsBeingLookedUpEvent = _.debounce(function (username, keyCode, ctrlKey, metaKey) {
        var isBackSpaceOrSelectAllKey = isBackSpacePressed(keyCode) || isSelectAllOperationPerforming(keyCode, ctrlKey, metaKey);
        var isUserLookingForContextualMention = USER_IS_LOOKING_FOR_CONTEXTUAL_MENTION_REGEX.test(username);

        if (isBackSpaceOrSelectAllKey === false && isUserLookingForContextualMention) {
            analytics.send({ name: 'issue.comment.contextualMention.lookup' });
        }
    }, 500);

    return {
        fireAcceptedContextualMentionAnalyticsEvent: function fireAcceptedContextualMentionAnalyticsEvent() {
            analytics.send({ name: 'issue.comment.contextualMention.accepted' });
        },
        fireContextualMentionIsBeingLookedUpAnalyticsEvent: function fireContextualMentionIsBeingLookedUpAnalyticsEvent(username, keyCode, ctrlKey, metaKey) {
            contextualMentionIsBeingLookedUpEvent(username, keyCode, ctrlKey, metaKey);
        },
        fireUserMayAcceptSuggestionByUsingContextualMentionEvent: function fireUserMayAcceptSuggestionByUsingContextualMentionEvent(username) {
            _.any(["assignee", "reporter"], function (contextualMention) {
                if (contextualMention.indexOf(username) === 0 && contextualMention !== username) {
                    analytics.send({ name: 'issue.comment.contextualMention.mayAccepted' });
                    return true;
                }
            });
        }
    };
});

AJS.namespace('JIRA.MentionUserModel', null, require('jira/mention/mention-user'));
AJS.namespace('JIRA.Mention', null, require('jira/mention/mention'));
AJS.namespace('JIRA.Mention.Matcher', null, require('jira/mention/mention-matcher'));
AJS.namespace('JIRA.Mention.ScrollPusher', null, require('jira/mention/scroll-pusher'));
AJS.namespace('JIRA.Mention.ContextualMentionAnalyticsEvent', null, require('jira/mention/contextual-mention-analytics-event'));
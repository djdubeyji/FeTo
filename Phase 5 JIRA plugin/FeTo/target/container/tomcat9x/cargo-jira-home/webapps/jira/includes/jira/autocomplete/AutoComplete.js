define('jira/autocomplete/autocomplete', ['jira/ajs/ajax/smart-ajax', 'jira/util/key-code', 'jira/util/objects', 'jira/util/formatter', 'jquery'], function (SmartAjax, keyCodes, Objects, formatter, jQuery) {
    'use strict';

    /**
     * @class AutoComplete
     * @requires jQuery.aop
     */

    return function () {

        var inFocus;

        /**
         * Calls a callback after specified delay
         * @memberof AutoComplete.prototype
         * @param {Number} l - length of delay in <em>seconds</em>
         * @param {Function} callback - function to call after delay
         */
        var delay = function delay(callback, l) {
            if (delay.t) {
                clearTimeout(delay.t);
                delay.t = undefined;
            }
            delay.t = setTimeout(callback, l * 1000);
        };

        var INVALID_KEYS = {
            9: true,
            13: true,
            14: true,
            25: true,
            27: true,
            38: true,
            40: true,
            224: true
        };

        return (/** @lends AutoComplete.prototype */{

                /**
                * Checks whether a saved version (cached) of the request exists, if not performs a request and saves response,
                * then dispatches saved response to <em>renderSuggestions</em> method.
                *
                * @public
                */
                dispatcher: function dispatcher() {},

                /**
                 * Gets cached response
                 *
                 * @public
                 * @param {String} val
                 * @returns {Object}
                 */
                getSavedResponse: function getSavedResponse() {},

                /**
                 * Saves response
                 *
                 * @public
                 * @param {String} val
                 * @param {Object} response
                 */
                saveResponse: function saveResponse() {},

                /**
                 * Called to render suggestions. Used to define interface only.
                 * Rendering is difficult to make generic, best to leave this to extending prototypes.
                 *
                 * @public
                 * @param {Object} res - results object
                 */
                renderSuggestions: function renderSuggestions() {},

                /**
                 * Disables autocomplete. Useful for shared inputs.
                 * i.e The selection of a radio button may disable the instance
                 * @Public
                 */
                disable: function disable() {
                    this.disabled = true;
                },

                /**
                 * Enables autocomplete. Useful for shared inputs.
                 * i.e The selection of a radio button may disable the instance
                 * @Public
                 */
                enable: function enable() {
                    this.disabled = false;
                },

                /**
                 * Sets instance variables from options object
                 * to do: make function create getters and setters
                 * @public
                 * @param {Object} options
                 */
                set: function set(options) {
                    for (var name in options) {
                        // safeguard to stop looping up the inheritance chain
                        if (options.hasOwnProperty(name)) {
                            this[name] = options[name];
                        }
                    }
                },

                /**
                 * Adds value to input field
                 * @public
                 * @param {String} value
                 */
                completeField: function completeField(value) {
                    if (value) {
                        this.field.val(value).focus();
                        this.field.trigger("change");
                    }
                },

                /**
                 * Returns the text from the start of the field up to the end of
                 * the position where suggestions are generated from.
                 */
                textToSuggestionCursorPosition: function textToSuggestionCursorPosition() {
                    return this.field.val();
                },

                /**
                 * An ajax request filter that only allows one request at a time. If there is another it will abort then issue
                 * the new request.
                 *
                 * @param options - jQuery formatted ajax options
                 */
                _makeRequest: function _makeRequest(options) {
                    var that = this;
                    var requestParams = Objects.copyObject(options);

                    // if we have we are still waiting for an old request, lets abort it as we are firing a new
                    if (this.pendingRequest) {
                        this.pendingRequest.abort();
                    }

                    requestParams.complete = function () {
                        that.pendingRequest = null;
                    };

                    requestParams.error = function (xhr) {

                        // We abort stale requests and this subsequently throws an error so we need to check if the request is aborted first.
                        // We detect this using xhr.aborted property for native XHR requests but for "Microsoft.XMLHTTP" we use the status code, which is 0.
                        // Status code is set to 0 when it is an unknown error so sense to fail silently.
                        if (!xhr.aborted && xhr.status !== 0 && options.error) {
                            options.error.apply(this, arguments);
                        }
                    };

                    this.pendingRequest = SmartAjax.makeRequest(requestParams);

                    return this.pendingRequest;
                },

                /**
                 * Allows users to navigate/select suggestions using the keyboard
                 * @public
                 */
                addSuggestionControls: function addSuggestionControls(suggestionNodes) {

                    // reference to this for closures
                    var that = this;

                    /**
                     * Make sure the index is within the threshold
                     * Looks ugly! Has to be a better way.
                     * @private
                     * @param {Integer} idx
                     * @param {Integer} max
                     * @return {Integer} valid threshold
                     */
                    var evaluateIndex = function evaluateIndex(idx, max) {
                        var minBoundary = that.autoSelectFirst === false ? -1 : 0;
                        if (that.allowArrowCarousel) {
                            if (idx > max) {
                                return minBoundary;
                            } else if (idx < minBoundary) {
                                return max;
                            } else {
                                return idx;
                            }
                        } else {
                            if (idx > max) {
                                return max;
                            } else if (idx < minBoundary) {
                                that.responseContainer.scrollTop(0);
                                return minBoundary;
                            } else {
                                return idx;
                            }
                        }
                    };

                    /**
                     * Highlights focused node and removes highlight from previous.
                     * Actual highlight styles to come from css, adding and removing classes here.
                     * @private
                     * @param {Integer} idx - Index of node to be highlighted
                     */
                    var setActive = function setActive(idx) {

                        // if nothing is selected, select the first suggestion
                        if (that.selectedIndex !== undefined && that.selectedIndex > -1) {
                            that.suggestionNodes[that.selectedIndex][0].removeClass("active");
                        }
                        that.selectedIndex = evaluateIndex(idx, that.suggestionNodes.length - 1);
                        if (that.selectedIndex > -1) {
                            that.suggestionNodes[that.selectedIndex][0].addClass("active");
                        }
                    };

                    /**
                     * Checks to see if there is actually a suggestion in focus before attempting to use it
                     * @private
                     * @returns {boolean}
                     */
                    var evaluateIfActive = function evaluateIfActive() {
                        return that.suggestionNodes && that.suggestionNodes[that.selectedIndex] && that.suggestionNodes[that.selectedIndex][0].hasClass("active");
                    };

                    /**
                    * Сhanges or adds text for assistive technology
                    * @param {String} optionName - option name
                    * @param {Integer} optionIndex - index of current option
                    * @param {Integer} optionsLength - number of options
                    */
                    var changeAssistiveText = function changeAssistiveText(_ref) {
                        var optionName = _ref.optionName,
                            optionIndex = _ref.optionIndex,
                            optionsLength = _ref.optionsLength;

                        that.assistiveContainer.text(formatter.I18n.getText('navigator.advanced.query.selected.option', optionName, optionIndex, optionsLength));
                    };

                    /**
                     * When the responseContainer (dropdown) is visible listen for keyboard events
                     * that represent focus or selection.
                     * @private
                     * @param {Object} e - event object
                     */
                    var keyPressHandler = function keyPressHandler(e) {
                        // only use keyboard events if dropdown is visible
                        if (that.responseContainer.is(":visible")) {
                            // if enter key is pressed check that there is a node selected, then hide dropdown and complete field
                            if (e.keyCode === keyCodes.ENTER) {
                                if (evaluateIfActive() && !that.pendingRequest) {
                                    that.completeField(that.suggestionNodes[that.selectedIndex][1]);
                                }
                                e.preventDefault();
                                // hack - stop propagation to prevent dialog from submitting. Looking for eg JIRA.Dropdown.current doesn't work.
                                e.stopPropagation();
                            }
                        }
                    };

                    /**
                    * sets focus on suggestion nodes using the "up" and "down" arrows
                    * These events need to be fired on mouseup as modifier keys don't register on keypress
                    * @private
                    * @param {Object} e - event object
                    */
                    var keyboardNavigateHandler = function keyboardNavigateHandler(e) {

                        // only use keyboard events if dropdown is visible
                        if (that.responseContainer.is(":visible")) {

                            // keep cursor inside input field
                            if (that.field[0] !== document.activeElement) {
                                that.field.focus();
                            }
                            // move selection down when down arrow is pressed
                            if (e.keyCode === keyCodes.DOWN) {
                                setActive(that.selectedIndex + 1);
                                if (that.selectedIndex >= 0) {
                                    // move selection up when up arrow is pressed
                                    var containerHeight = that.responseContainer.height();
                                    var bottom = that.suggestionNodes[that.selectedIndex][0].position().top + that.suggestionNodes[that.selectedIndex][0].outerHeight();

                                    if (bottom - containerHeight > 0) {
                                        that.responseContainer.scrollTop(that.responseContainer.scrollTop() + bottom - containerHeight + 2);
                                    }
                                    changeAssistiveText({
                                        optionName: that.suggestionNodes[that.selectedIndex][1],
                                        optionIndex: that.selectedIndex + 1,
                                        optionsLength: that.suggestionNodes.length
                                    });
                                } else {
                                    that.responseContainer.scrollTop(0);
                                }
                                e.preventDefault();
                            } else if (e.keyCode === keyCodes.UP) {
                                setActive(that.selectedIndex - 1);
                                if (that.selectedIndex >= 0) {
                                    // if tab key is pressed check that there is a node selected, then hide dropdown and complete field
                                    var top = that.suggestionNodes[that.selectedIndex][0].position().top;
                                    if (top < 0) {
                                        that.responseContainer.scrollTop(that.responseContainer.scrollTop() + top - 2);
                                    }
                                    changeAssistiveText({
                                        optionName: that.suggestionNodes[that.selectedIndex][1],
                                        optionIndex: that.selectedIndex + 1,
                                        optionsLength: that.suggestionNodes.length
                                    });
                                }
                                e.preventDefault();
                            } else if (e.keyCode === keyCodes.TAB) {
                                if (evaluateIfActive()) {
                                    that.completeField(that.suggestionNodes[that.selectedIndex][1]);
                                    e.preventDefault();
                                } else {
                                    that.dropdownController.hideDropdown();
                                }
                            }
                        }
                    };

                    if (suggestionNodes.length) {

                        this.selectedIndex = 0;
                        this.suggestionNodes = suggestionNodes;

                        for (var i = 0; i < that.suggestionNodes.length; i++) {
                            var eventData = { instance: this, index: i };
                            this.suggestionNodes[i][0].bind("mouseover", eventData, activate).bind("mouseout", eventData, deactivate).bind("click", eventData, complete).bind("mousedown", function (e) {
                                e.preventDefault();
                            });
                        }

                        // make sure we don't bind more than once
                        if (!this.keyboardHandlerBinded) {
                            jQuery(this.field).keypress(keyPressHandler);
                            jQuery(this.field).keydown(keyboardNavigateHandler);
                            this.keyboardHandlerBinded = true;
                        }

                        // automatically select the first in the list
                        if (that.autoSelectFirst === false) {
                            setActive(-1);
                        } else {
                            setActive(0);
                        }

                        // sets the autocomplete singleton infocus var to this instance
                        // is used to toggle event propagation. In short, the instance that it is set to will not hide the
                        // dropdown each time you click the input field
                        inFocus = this;
                    }

                    function activate(event) {
                        if (that.dropdownController.displayed) {
                            setActive(event.data.index);
                        }
                    }
                    function deactivate(event) {
                        if (event.data.index === 0) {
                            that.selectedIndex = -1;
                        }
                        jQuery(this).removeClass("active");
                    }
                    function complete(event) {
                        that.completeField(that.suggestionNodes[event.data.index][1]);
                    }
                },

                /**
                 * Uses jquery empty command, this is VERY important as it unassigns handlers
                 * used for mouseover, click events which expose an opportunity for memory leaks
                 * @public
                 */
                clearResponseContainer: function clearResponseContainer() {
                    this.responseContainer.empty();
                    this.suggestionNodes = undefined;
                },

                delay: delay,

                /**
                 * Builds HTML container for suggestions.
                 * Positions container top position to be that of the field height
                 * @public
                 */
                buildResponseContainer: function buildResponseContainer() {
                    var inputParent = this.field.parent().addClass('atlassian-autocomplete');
                    this.responseContainer = jQuery(document.createElement("div"));
                    this.responseContainer.addClass("suggestions");
                    this.positionResponseContainer();
                    this.responseContainer.appendTo(inputParent);

                    this.assistiveContainer = jQuery(document.createElement("div"));
                    this.assistiveContainer.attr({
                        "role": "status",
                        "class": "autocomplete-assistive assistive"
                    });
                    this.assistiveContainer.appendTo(inputParent);
                },

                positionResponseContainer: function positionResponseContainer() {
                    this.responseContainer.css({ top: this.field.outerHeight() });
                },

                /**
                 * Validates the keypress by making sure the field value is beyond the set threshold and the key was either an
                 * up or down arrow
                 * @public
                 * @param {Object} e - event object
                 */
                keyUpHandler: function () {
                    function callback() {
                        if (!this.responseContainer) {
                            this.buildResponseContainer();
                        }
                        // send value to dispatcher to check if we have already got the response or if we need to go
                        // back to the server
                        this.dispatcher(this.field.val());
                    }

                    return function (e) {
                        // only initialises once the field length is past set length
                        if (this.field.val().length >= this.minQueryLength) {
                            // don't do anything if the key pressed is "enter" or "down" or "up" or "right" "left"
                            if (!(e.keyCode in INVALID_KEYS) || this.responseContainer && !this.responseContainer.is(":visible") && (e.keyCode === keyCodes.UP || e.keyCode === keyCodes.DOWN)) {
                                callback.call(this);
                            }
                        }
                        return e;
                    };
                }(),

                /**
                 * Adds in methods via AOP to handle multiple selections
                 * @Public
                 */
                addMultiSelectAdvice: function addMultiSelectAdvice(delim) {

                    // reference to this for closures
                    var that = this;

                    /**
                     * Alerts user if value already exists
                     * @private
                     * @param {String} val - value that already exists, will be displayed in message to user.
                     */
                    var alertUserValueAlreadyExists = function alertUserValueAlreadyExists(val) {

                        // check if there is an existing alert before adding another
                        if (!alertUserValueAlreadyExists.isAlerting) {

                            alertUserValueAlreadyExists.isAlerting = true;

                            // create alert node and append it to the input field's parent, fade it in then out with a short
                            // delay in between.
                            //TODO: JRA-1800 - Needs i18n!
                            var userAlert = jQuery(document.createElement("div")).css({ "float": "left", display: "none" }).addClass("warningBox").html("Oops! You have already entered the value <em>" + val + "</em>").appendTo(that.field.parent()).show("fast", function () {
                                // display message for 4 seconds before fading out
                                that.delay(function () {
                                    userAlert.hide("fast", function () {
                                        // removes element from dom
                                        userAlert.remove();
                                        alertUserValueAlreadyExists.isAlerting = false;
                                    });
                                }, 4);
                            });
                        }
                    };

                    // rather than request the entire field return the last comma seperated value
                    jQuery.aop.before({ target: this, method: "dispatcher" }, function (innvocation) {
                        // matches everything after last comma
                        var val = this.field.val();
                        innvocation[0] = jQuery.trim(val.slice(val.lastIndexOf(delim) + 1));
                        return innvocation;
                    });

                    // rather than replacing this field just append the new value
                    jQuery.aop.before({ target: this, method: "completeField" }, function (args) {
                        var valueToAdd = args[0];

                        // create array of values
                        var untrimmedVals = this.field.val().split(delim);

                        // trim the values in the array so we avoid extra spaces being appended to the usernames - see JRA-20657
                        var trimmedVals = jQuery(untrimmedVals).map(function () {
                            return jQuery.trim(this);
                        }).get();
                        // check if the value to append already exists. If it does then call alert to to tell user and sets
                        // the last value to "". The value to add will either appear:
                        // 1) at the start of the string
                        // 2) after some whitespace; or
                        // 3) directly after the delimiter
                        // It is assumed that the value is delimited by the delimiter character surrounded by any number of spaces.
                        if (!this.allowDuplicates && new RegExp("(?:^|[\\s" + delim + "])" + valueToAdd + "\\s*" + delim).test(this.field.val())) {
                            alertUserValueAlreadyExists(valueToAdd);
                            trimmedVals[trimmedVals.length - 1] = "";
                        } else {
                            // add the new value to the end of the array and then an empty value so we
                            // can get an extra delimiter at the end of the joined string
                            trimmedVals[trimmedVals.length - 1] = valueToAdd;
                            trimmedVals[trimmedVals.length] = "";
                        }

                        // join the array of values with the delimiter plus an extra space to make the list of values readable
                        args[0] = trimmedVals.join(delim.replace(/([^\s]$)/, "$1 "));

                        return args;
                    });
                },

                /**
                 * Adds and manages state of dropdown control
                 * @Public
                 */
                addDropdownAdvice: function addDropdownAdvice() {
                    // add dropdown functionality to response container
                    jQuery.aop.after({ target: this, method: "buildResponseContainer" }, function (args) {
                        this.dropdownController = JIRA.Dropdown.AutoComplete({ target: this, method: "renderSuggestions" }, this.responseContainer);

                        jQuery.aop.after({ target: this.dropdownController, method: "hideDropdown" }, function () {
                            this.dropdown.removeClass("dropdown-ready");
                            clearTimeout(delay.t);
                        });

                        return args;
                    });

                    // display dropdown afer suggestions are updated
                    jQuery.aop.after({ target: this, method: "renderSuggestions" }, function (args) {
                        if (args && args.length > 0) {
                            this.dropdownController.displayDropdown();

                            if (this.maxHeight && this.dropdownController.dropdown.prop("scrollHeight") > this.maxHeight) {
                                this.dropdownController.dropdown.css({
                                    height: this.maxHeight,
                                    overflowX: "visible",
                                    overflowY: "scroll"
                                });
                            } else if (this.maxHeight) {
                                this.dropdownController.dropdown.css({
                                    height: "",
                                    overflowX: "",
                                    overflowY: ""
                                });
                            }
                            this.dropdownController.dropdown.addClass("dropdown-ready");
                        } else {
                            this.dropdownController.hideDropdown();
                        }
                        return args;
                    });

                    // hide dropdown after suggestion value is applied to field
                    jQuery.aop.after({ target: this, method: "completeField" }, this._afterCompleteField);

                    jQuery.aop.after({ target: this, method: "keyUpHandler" }, function (e) {
                        // only initialises once the field length is past set length
                        if ((!(this.field.val().length >= this.minQueryLength) || e.keyCode === keyCodes.ESCAPE) && this.dropdownController && this.dropdownController.displayed) {
                            this.dropdownController.hideDropdown();
                            if (e.keyCode === keyCodes.ESCAPE) {
                                e.stopPropagation();
                            }
                        }
                        return e;
                    });
                },

                _afterCompleteField: function _afterCompleteField(args) {
                    this.dropdownController.hideDropdown();
                    return args;
                },

                /**
                 * Initialises autocomplete by setting options, and assigning event handler to input field.
                 * @param {Object} options
                 * @constructs
                 */
                init: function init(options) {
                    var that = this;
                    this.set(options);
                    this.field = this.field || jQuery("#" + this.fieldID);
                    // turn off browser default autocomplete
                    this.field.attr("autocomplete", "off").keyup(function (e) {
                        if (!that.disabled) {
                            that.keyUpHandler(e);
                        }
                    }).keydown(function (e) {
                        // do not clear field in IE
                        if (e.keyCode === keyCodes.ESCAPE && that.responseContainer && that.responseContainer.is(":visible")) {
                            e.preventDefault();
                        }
                    }).click(function () {
                        if (inFocus === that) {
                            setTimeout(function () {
                                that.dispatcher(that.field.val());
                            }, 0);
                        }
                    }).blur(function () {
                        // we don't want the request to come back and show suggestions if we have already moved away from field
                        if (that.pendingRequest) {
                            that.pendingRequest.abort();
                        }
                    }).focus(function (e) {
                        // We need to handle only focus events triggered by tab button, because focus event triggered by mouse click
                        // is handled in click handler (Autocomplete.js#click)
                        // e.originalEvent.relatedTarget transitively shows that focus was triggered by keyboard
                        if (!that.responseContainer) {
                            that.buildResponseContainer();
                        }
                        if (!that.disabled) {
                            if (e.originalEvent && e.originalEvent.relatedTarget) {
                                setTimeout(function () {
                                    that.dispatcher(that.field.val());
                                }, 0);
                            }
                            inFocus = that;
                        }
                    });

                    this.addDropdownAdvice();

                    if (options.delimChar) {
                        this.addMultiSelectAdvice(options.delimChar);
                    }
                }
            }
        );
    }();
});

/** Preserve legacy namespace
 @deprecated jira.widget.autocomplete */
AJS.namespace("jira.widget.autocomplete", null, require('jira/autocomplete/autocomplete'));
AJS.namespace('JIRA.AutoComplete', null, require('jira/autocomplete/autocomplete'));
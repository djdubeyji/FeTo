/**
 * Fetches suggestions for a control from some source location.
 *
 * @interface DescriptorFetcher
 */

/**
 * Sets up a request
 *
 * @function
 * @name DescriptorFetcher#execute
 * @param {Function} query - lazily evaluated value of input field.
 * @param {Boolean} force - Piss off all buffers etc. Make request now!
 * @return {jQuery.Deferred}
 */

define('jira/ajs/select/suggestions/suggest-helper', ['jira/ajs/list/group-descriptor', 'jira/ajs/list/item-descriptor', 'jira/ajs/select/fetchers/mixed-descriptor-fetcher', 'jira/ajs/select/fetchers/ajax-descriptor-fetcher', 'jira/ajs/select/fetchers/func-descriptor-fetcher', 'jira/ajs/select/fetchers/static-descriptor-fetcher', 'underscore'], function (GroupDescriptor, ItemDescriptor, MixedDescriptorFetcher, AjaxDescriptorFetcher, FuncDescriptorFetcher, StaticDescriptorFetcher, _) {
    'use strict';

    /**
     * A utility object to manipulate/create suggestions
     * @name SuggestHelper
     * @exports jira/ajs/select/suggestions/suggest-helper
     */

    return {

        /**
         * Factory method to create descriptor fetcher based on user options
         *
         * @param options
         * @param {SelectModel} model
         */
        createDescriptorFetcher: function createDescriptorFetcher(options, model) {
            if (options.ajaxOptions && options.ajaxOptions.url) {
                if (model && options.content === "mixed") {
                    return new MixedDescriptorFetcher(options, model);
                } else {
                    return new AjaxDescriptorFetcher(options.ajaxOptions, model, options.containsStaticSuggestions);
                }
            } else if (options.suggestions) {
                return new FuncDescriptorFetcher(options);
            } else if (model) {
                return new StaticDescriptorFetcher(options, model);
            }
        },

        /**
         * Extract all item descriptors within an array of group descriptors.
         *
         * @param descriptors {GroupDescriptor[]} The group descriptors.
         * @return {ItemDescriptor[]} All item descriptors within.
         */
        extractItems: function extractItems(descriptors) {
            return _.flatten(_.map(descriptors, function (descriptor) {
                if (descriptor instanceof GroupDescriptor) {
                    return descriptor.items();
                } else {
                    return [descriptor];
                }
            }));
        },
        /**
         * Creates a descriptor group that mirrors the inputted query
         * @param {String} query
         * @param {String} label
         * @param {Boolean} uppercaseValue
         * @return {GroupDescriptor}
         */
        mirrorQuery: function mirrorQuery(query, label, uppercaseValue) {
            var value = uppercaseValue ? query.toUpperCase() : query;
            return new GroupDescriptor({
                label: "user inputted option",
                showLabel: false,
                replace: true
            }).addItem(new ItemDescriptor({
                value: value,
                label: value,
                labelSuffix: " (" + label + ")",
                title: value,
                allowDuplicate: false,
                noExactMatch: true // this item doesn't count as an exact query match for selection purposes
            }));
        },
        /**
         * Does the item descriptor match any of the selected values
         * @param {ItemDescriptor} itemDescriptor
         * @param {String[]} selectedVals
         * @return {Boolean}
         */
        isSelected: function isSelected(itemDescriptor, selectedVals) {
            return _.any(selectedVals, function (descriptor) {
                return itemDescriptor.value() === descriptor.value();
            });
        },
        /**
         * Removes duplicate descriptors
         *
         * @param descriptors
         * @param vals
         * @return {Array}
         */
        removeDuplicates: function removeDuplicates(descriptors, vals) {
            vals = vals || [];
            return _.filter(descriptors, _.bind(function (descriptor) {
                if (descriptor instanceof GroupDescriptor) {
                    descriptor.items(this.removeDuplicates(descriptor.items(), vals));
                    return true;
                } else if (!_.include(vals, descriptor.value())) {
                    if (descriptor.value()) {
                        vals.push(descriptor.value());
                    }
                    return true;
                }
            }, this));
        },
        /**
         * Loop over all descriptors and remove descriptors that match selected vals. Usually if the user has already
         * selected a suggestion, we don't want to show it.
         * @param {GroupDescriptor[] | ItemDescriptor[]} descriptors
         * @param {String[]} selectedValues
         * @return {GroupDescriptor[] | ItemDescriptor[]} descriptors
         * @private
         */
        removeSelected: function removeSelected(descriptors, selectedValues) {
            return _.filter(descriptors, _.bind(function (descriptor) {
                if (descriptor instanceof ItemDescriptor && this.isSelected(descriptor, selectedValues)) {
                    return false;
                }
                if (descriptor instanceof GroupDescriptor) {
                    descriptor.items(this.removeSelected(descriptor.items(), selectedValues));
                }
                return true;
            }, this));
        }
    };
});

define('jira/ajs/select/suggestions/default-suggest-handler', ['jira/jquery/deferred', 'jira/lib/class', 'jira/ajs/select/suggestions/suggest-helper', 'underscore'], function (Deferred, Class, SuggestHelper, _) {
    'use strict';

    /**
     * A default suggestion handler. Used for autocomplete without a backing &lt;select>
     * @class SuggestHandler
     * @class DefaultSuggestHandler
     * @exports jira/ajs/select/suggestions/default-suggest-handler
     */

    return Class.extend({
        /**
         * @param {Object} options
         * @constructs
         */
        init: function init(options) {
            this.options = options;
            this.descriptorFetcher = SuggestHelper.createDescriptorFetcher(options);
        },
        /**
         * Check if we should mirror input as a suggestion
         * @param {String} query
         * @return {Boolean}
         */
        validateMirroring: function validateMirroring(query) {
            return this.options.userEnteredOptionsMsg && query.length > 0;
        },
        /**
         * Applies default formatting
         *
         * @param {Array} descriptors
         * @param {String} query
         * @return {*}
         */
        formatSuggestions: function formatSuggestions(descriptors, query) {
            if (this.validateMirroring(query)) {

                descriptors.push(SuggestHelper.mirrorQuery(query, this.options.userEnteredOptionsMsg, this.options.uppercaseUserEnteredOnSelect));
            }
            return descriptors;
        },

        /**
         * Requests descriptors then formats them
         * @param {String} query
         * @param {Boolean} force
         * @return {*}
         */
        execute: function execute(query, force) {
            var deferred = new Deferred();
            var fetcherDef = this.descriptorFetcher.execute(query, force).done(_.bind(function (descriptors) {
                if (descriptors) {
                    descriptors = this.formatSuggestions(descriptors, query);
                }
                deferred.resolve(descriptors, query);
            }, this));
            deferred.fail(function () {
                fetcherDef.reject();
            });
            return deferred;
        }
    });
});

/**
 * @module jira/ajs/select/suggestions/select-suggest-handler
 */
define('jira/ajs/select/suggestions/select-suggest-handler', ['jira/ajs/select/suggestions/default-suggest-handler', 'jira/ajs/select/suggestions/suggest-helper'], function (DefaultSuggestHandler, SuggestHelper) {
    'use strict';

    /**
     * A suggestion handler that removes suggestions that have already been selected in &lt;select>
     * @class SelectSuggestHandler
     * @extends DefaultSuggestHandler
     * @exports jira/ajs/select/suggestions/select-suggest-handler
     */

    return DefaultSuggestHandler.extend({
        /**
         * @param {Object} options
         * @param {SelectModel} model
         * @constructs
         */
        init: function init(options, model) {
            this.descriptorFetcher = SuggestHelper.createDescriptorFetcher(options, model);
            this.options = options;
            this.model = model;
        },
        /**
         * Formats suggestions removing already selected descriptors
         * @param descriptors
         * @param query
         * @return {GroupDescriptor[]}*/
        formatSuggestions: function formatSuggestions(descriptors, query) {
            var suggestions = this._super(descriptors, query);
            var selectedDescriptors = this.model.getDisplayableSelectedDescriptors();
            if (this.options.removeDuplicates) {
                suggestions = SuggestHelper.removeDuplicates(descriptors);
            }

            if (this.options.disableRemoveSelected === true) {
                return suggestions;
            }
            return SuggestHelper.removeSelected(suggestions, selectedDescriptors);
        }
    });
});

define('jira/ajs/select/suggestions/assignee-suggest-handler', ['jira/util/formatter', 'jira/ajs/select/suggestions/select-suggest-handler'], function (formatter, SelectSuggestHandler) {
    'use strict';

    /**
     * Special handler for assignee picker that appends some footer text prompting user to start typing for more options.
     * @class AssigneeSuggestHandler
     * @extends SelectSuggestHandler
     * @exports jira/ajs/select/suggestions/assignee-suggest-handler
     */

    return SelectSuggestHandler.extend({
        /**
         * Formats suggestions removing already selected descriptors
         * @param descriptors
         * @param query
         * @return {GroupDescriptor[]}
         */
        formatSuggestions: function formatSuggestions(descriptors, query) {
            var groupDescriptors = this._super(descriptors, query);
            if (query.length === 0) {
                groupDescriptors[0].footerText(formatter.I18n.getText("user.picker.ajax.short.desc"));
            }
            return groupDescriptors;
        }
    });
});

define('jira/ajs/select/suggestions/checkbox-multi-select-suggest-handler', ['jira/util/formatter', 'jira/ajs/select/suggestions/select-suggest-handler', 'jira/ajs/select/suggestions/suggest-helper', 'jira/ajs/list/group-descriptor'], function (formatter, SelectSuggestHandler, SuggestHelper, GroupDescriptor) {
    'use strict';

    /**
     * A suggestion handler that without a query, shows selected items at the top followed by unselected items in their groups.
     * When querying selected and unselected items are munged together and sorted in alphabetical order.
     * @class CheckboxMultiSelectSuggestHandler
     * @extends SelectSuggestHandler
     * @exports jira/ajs/select/suggestions/checkbox-multi-select-suggest-handler
     */

    return SelectSuggestHandler.extend({

        /**
         * Creates html string for clear all
         * @return {String}
         */
        createClearAll: function createClearAll() {
            return "<li class='check-list-group-actions'><a class='clear-all' href='#'>" + formatter.I18n.getText("jira.ajax.autocomplete.clear.all") + "</a></li>";
        },

        /**
         * Formats descriptors for display in checkbox multiselect
         *
         * @param descriptors
         * @param query
         * @return {Array} formatted descriptors
         */
        formatSuggestions: function formatSuggestions(descriptors, query) {

            var selectedItems = SuggestHelper.removeDuplicates(this.model.getDisplayableSelectedDescriptors());
            var selectedGroup = new GroupDescriptor({
                styleClass: "selected-group",
                items: selectedItems,
                actionBarHtml: selectedItems.length > 1 ? this.createClearAll() : null
            });
            descriptors.splice(0, 0, selectedGroup);
            if (query.length > 0) {
                descriptors = SuggestHelper.removeDuplicates(descriptors);
                // Extract all items from the descriptors and sort them by label.
                var items = SuggestHelper.extractItems(descriptors).sort(function (a, b) {
                    a = a.label().toLowerCase();
                    b = b.label().toLowerCase();
                    return a.localeCompare(b);
                });

                var fetchedDescriptor = descriptors.find(function (descriptor) {
                    return descriptor.fetchedThroughAjaxCall !== undefined && descriptor.fetchedThroughAjaxCall();
                });
                var footerText = fetchedDescriptor ? fetchedDescriptor.footerText() : undefined;

                descriptors = [new GroupDescriptor({ items: items, footerText: footerText })];
            }
            return descriptors;
        }
    });
});

define('jira/ajs/select/suggestions/user-list-suggest-handler', ['jira/ajs/select/suggestions/select-suggest-handler'], function (SelectSuggestHandler) {
    'use strict';

    /**
     * Special handler for share dialog pickers.
     * @class UserListSuggestHandler
     * @extends SelectSuggestHandler
     * @exports jira/ajs/select/suggestions/user-list-suggest-handler
     */

    return SelectSuggestHandler.extend({
        /**
         * Tests valid email address
         */
        emailExpression: /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/,
        /**
         * Only mirror user input if it is a valid email address
         * @param {String} query
         * @return {Boolean}
         */
        validateMirroring: function validateMirroring(query) {
            return this.options.freeEmailInput && query.length > 0 && this.emailExpression.test(query);
        }
    });
});

/**
 * @module jira/ajs/select/suggestions/only-new-items-suggest-handler
 */
define('jira/ajs/select/suggestions/only-new-items-suggest-handler', ['jira/ajs/select/suggestions/select-suggest-handler', 'underscore'], function (SelectSuggestHandler, _) {
    'use strict';

    /**
     * Special handler that will only allow new items to be mirrored.
     * An item is considered new if it does not match the label of any of the displayable options.
     * Matching is case-insensitive.
     *
     * @class OnlyNewItemsSuggestHandler
     * @extends SelectSuggestHandler
     * @exports jira/ajs/select/suggestions/only-new-items-suggest-handler
     */

    return SelectSuggestHandler.extend({
        /**
         * Only mirror user input if it doesn't exist yet in the list of options based on label match.
         * @param {String} query
         * @return {Boolean}
         */
        validateMirroring: function validateMirroring(query) {
            var allowMirroring = this._super(query);
            if (allowMirroring) {
                var lowerCaseQuery = query.toLowerCase();
                var allExistingDescriptors = this.model.getDisplayableSelectedDescriptors().concat(this.model.getDisplayableUnSelectedDescriptors());
                var existingItem = _.some(allExistingDescriptors, function (descriptor) {
                    var label = descriptor.label();
                    return label && label.toLowerCase() === lowerCaseQuery;
                });
                return !existingItem;
            }
            return false;
        }
    });
});

define('jira/ajs/select/fetchers/static-descriptor-fetcher', ['jira/jquery/deferred', 'jira/lib/class'], function (Deferred, Class) {
    'use strict';

    /**
     * Gets unselected <option>s from <select> as suggestions
     * @class StaticDescriptorFetcher
     * @extends Class
     * @implements DescriptorFetcher
     * @exports jira/ajs/select/fetchers/static-descriptor-fetcher
     */

    return Class.extend({
        /**
         * @param {Object} options - empty in this case
         * @param {SelectModel} model - a wrapper around &lt;select> element
         * @constructs
         */
        init: function init(options, model) {
            this.model = model;
            this.model.$element.data("static-suggestions", true);
        },
        /**
         * @return {jQuery.Deferred}
         */
        execute: function execute(query) {
            var deferred = new Deferred();
            deferred.resolve(this.model.getUnSelectedDescriptors(), query);
            return deferred;
        }
    });
});

define('jira/ajs/select/fetchers/ajax-descriptor-fetcher', ['jira/util/logger', 'jira/jquery/deferred', 'jira/lib/class', 'jira/ajs/ajax/smart-ajax', 'underscore'], function (logger, Deferred, Class, SmartAjax, _) {
    'use strict';

    /**
     * Retrieves json from server and converts it into descriptors using formatSuggestions function supplied by user.
     * @class AjaxDescriptorFetcher
     * @extends Class
     * @implements DescriptorFetcher
     * @exports jira/ajs/select/fetchers/ajax-descriptor-fetcher
     */

    return Class.extend({

        /**
         * @param options
         * @constructs
         */
        init: function init(options, model, containsStaticSuggestions) {
            this.options = _.extend({
                keyInputPeriod: 150, // Wait this long between key strokes before going to server
                minQueryLength: 1, // Need these many characters before we go to server
                data: {},
                dataType: "json"
            }, options);

            if (model) {
                this.model = model;
            }

            if (containsStaticSuggestions) {
                this.model.$element.data("static-suggestions", true);
            }

            this.debouncedMakeRequest = _.debounce(this.makeRequest, this.options.keyInputPeriod);
        },

        // Actually make the request and notify those interested
        makeRequest: function makeRequest(deferred, ajaxOptions, query) {
            ajaxOptions.complete = _.bind(function () {
                this.outstandingRequest = null;
                logger.trace("jira.suggestionhandler.done");
            }, this);
            ajaxOptions.success = _.bind(function (data) {
                if (ajaxOptions.query) {
                    deferred.resolve(ajaxOptions.formatResponse(data, query));
                } else {
                    this.lastResponse = ajaxOptions.formatResponse(data, query);
                    deferred.resolve(this.lastResponse);
                }
            }, this);
            var originalError = ajaxOptions.error;
            ajaxOptions.error = function (xhr, textStatus, msg, smartAjaxResult) {
                if (!smartAjaxResult.aborted) {
                    if (originalError) {
                        originalError.apply(this, arguments);
                    } else {
                        alert(SmartAjax.buildSimpleErrorContent(smartAjaxResult, { alert: true }));
                    }
                    deferred.resolve();
                } else {
                    if (smartAjaxResult.statusText === 'timeout') {
                        if (originalError) {
                            originalError.apply(this, arguments);
                        } else {
                            alert(SmartAjax.buildSimpleErrorContent(smartAjaxResult, { alert: true }));
                        }
                        deferred.resolve();
                    }
                }
            };

            this.outstandingRequest = SmartAjax.makeRequest(ajaxOptions); // issue request
        },

        /**
         * Prepare the data and control no. of requests sent
         * @param {jQuery.Deferred} deferred
         * @param {Object} ajaxOptions - standard jQuery ajax options
         * @param {number} ajaxOptions.minQueryLength - minimal length of input to go to server
         * @param {number} ajaxOptions.query - go to server on each keystroke
         * @param {String} query - in most cases this is the user input
         * @param {Boolean} flush - ignore request buffers. I want my request dispatched NOW.
         */
        incubateRequest: function incubateRequest(deferred, ajaxOptions, query, flush) {
            var force = ajaxOptions.query || flush;

            if (force && this.outstandingRequest) {
                // make sure costly operation is cancelled on backend as well
                this.outstandingRequest.abort();
                this.outstandingRequest = null;
            }

            var requestOptions = this.buildRequestOptions(ajaxOptions, query);

            if (flush) {
                // go to server on each keystroke
                this.makeRequest(deferred, requestOptions, query);
            } else {
                if (query.length >= parseInt(ajaxOptions.minQueryLength, 10)) {
                    if (ajaxOptions.query) {
                        this.makeRequest(deferred, requestOptions, query);
                    } else {
                        this.debouncedMakeRequest(deferred, requestOptions, query);
                    }
                } else if (this.lastResponse) {
                    deferred.resolve(this.lastResponse);
                } else {
                    deferred.resolve();
                }
            }

            return deferred;
        },
        /**
         * @param {Object} ajaxOptions - standard jQuery ajax options
         * @param {boolean} ajaxOptions.query - go to server on each keystroke but respect queue
         * @param {number} ajaxOptions.minQueryLength - minimum amount of chars to go to server
         * @param {String} query - in most cases this is the user input
         */
        buildRequestOptions: function buildRequestOptions(ajaxOptions, query) {
            if (typeof ajaxOptions.data === 'function') {
                ajaxOptions.data = ajaxOptions.data(query);
            } else {
                ajaxOptions.data.query = query;
            }

            if (typeof ajaxOptions.url === 'function') {
                ajaxOptions.url = ajaxOptions.url();
            }

            return ajaxOptions;
        },
        /**
         * Sets up a request
         * @param {Function} query - lazily evaluated value of input field.
         * @param {Boolean} force - Piss off all buffers etc. Make request now!
         * @return {jQuery.Deferred}
         */
        execute: function execute(query, force) {
            var deferred = new Deferred();
            deferred.fail(_.bind(function () {
                if (this.outstandingRequest) {
                    this.outstandingRequest.abort();
                }
            }, this));
            this.incubateRequest(deferred, _.extend({}, this.options), query, force);
            return deferred;
        }
    });
});

define('jira/ajs/select/fetchers/mixed-descriptor-fetcher', ['jira/jquery/deferred', 'jira/lib/class', 'jira/ajs/select/fetchers/ajax-descriptor-fetcher', 'underscore'], function (Deferred, Class, AjaxDescriptorFetcher, _) {
    'use strict';

    /**
     * Gets suggestions from unselected &lt;option>s in &lt;select> as well as going to the server upon character for more
     * results on input.
     *
     * @class MixedDescriptorFetcher
     * @extends Class
     * @implements DescriptorFetcher
     * @exports jira/ajs/select/fetchers/mixed-descriptor-fetcher
     */

    return Class.extend({
        /**
         * @param {Object} options - jQuery ajax options object. With additional:
         * @param {function} options.formatResponse - function for creating descriptors out of server response
         * @param {number} options.minQueryLength - min input length before a request is made
         * @param {Object} options.ajaxOptions
         * @param {SelectModel} model - a wrapper around &lt;select&gt; element
         * @constructs
         */
        init: function init(options, model) {
            this.ajaxFetcher = new AjaxDescriptorFetcher(options.ajaxOptions, model);
            this.options = options;
            this.model = model;

            if (options.containsStaticSuggestions) {
                this.model.$element.data("static-suggestions", true);
            }
        },
        /**
         * @param query
         * @param force
         * @return {jQuery.Deferred}
         */
        execute: function execute(query, force) {
            var deferred = new Deferred();
            // This needs to come after the return statement...
            var minQueryLength = this.options.ajaxOptions.minQueryLength;
            minQueryLength = typeof minQueryLength === "number" && isFinite(minQueryLength) ? minQueryLength : 1;
            if (query.length >= minQueryLength) {
                var ajaxDeferred = this.ajaxFetcher.execute(query, force).done(_.bind(function (suggestions) {
                    var descriptors;
                    if (this.options.suggestionAtTop) {
                        descriptors = [].concat(this.model.getAllDescriptors(), suggestions);
                    } else {
                        descriptors = [].concat(suggestions, this.model.getAllDescriptors());
                    }
                    deferred.resolve(descriptors, query);
                }, this));
                deferred.fail(function () {
                    ajaxDeferred.reject();
                });
            } else {
                deferred.resolve(this.model.getUnSelectedDescriptors(), query);
            }
            return deferred;
        }
    });
});

define('jira/ajs/select/fetchers/func-descriptor-fetcher', ['jira/jquery/deferred', 'jira/lib/class'], function (Deferred, Class) {
    'use strict';

    /**
     * A single fetcher that will just return the result of calling supplied function
     *
     * @class FuncDescriptorFetcher
     * @extends Class
     * @implements DescriptorFetcher
     * @exports jira/ajs/select/fetchers/func-descriptor-fetcher
     */

    return Class.extend({
        /**
         * @param {Object} options
         * @constructs
         */
        init: function init(options) {
            this.options = options;
        },
        /**
         * Gets result of function
         * @param query
         */
        execute: function execute(query) {
            var deferred = new Deferred();
            deferred.resolve(this.options.suggestions(query), query);
            return deferred;
        }
    });
});

AJS.namespace('AJS.SuggestHelper', null, require('jira/ajs/select/suggestions/suggest-helper'));
AJS.namespace('AJS.DefaultSuggestHandler', null, require('jira/ajs/select/suggestions/default-suggest-handler'));
AJS.namespace('AJS.SelectSuggestHandler', null, require('jira/ajs/select/suggestions/select-suggest-handler'));
AJS.namespace('AJS.OnlyNewItemsSuggestHandler', null, require('jira/ajs/select/suggestions/only-new-items-suggest-handler'));
AJS.namespace('AJS.CheckboxMultiSelectSuggestHandler', null, require('jira/ajs/select/suggestions/checkbox-multi-select-suggest-handler'));
AJS.namespace('JIRA.AssigneeSuggestHandler', null, require('jira/ajs/select/suggestions/assignee-suggest-handler'));
AJS.namespace('AJS.UserListSuggestHandler', null, require('jira/ajs/select/suggestions/user-list-suggest-handler'));

AJS.namespace('AJS.StaticDescriptorFetcher', null, require('jira/ajs/select/fetchers/static-descriptor-fetcher'));
AJS.namespace('AJS.AjaxDescriptorFetcher', null, require('jira/ajs/select/fetchers/ajax-descriptor-fetcher'));
AJS.namespace('AJS.MixedDescriptorFetcher', null, require('jira/ajs/select/fetchers/mixed-descriptor-fetcher'));
AJS.namespace('AJS.FuncDescriptorFetcher', null, require('jira/ajs/select/fetchers/func-descriptor-fetcher'));
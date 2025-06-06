define('jira/ajs/dropdown/dropdown-options-descriptor', ['jira/ajs/descriptor', 'jira/ajs/dropdown/dropdown-constants', 'jira/ajs/dropdown/dropdown-list-item-group', 'jira/ajs/contentretriever/ajax-content-retriever', 'jira/ajs/contentretriever/deferred-content-retriever', 'jira/ajs/contentretriever/dom-content-retriever', 'jquery'], function (Descriptor, Constants, ListItemGroup, AjaxContentRetriever, DeferredContentRetriever, DOMContentRetriever, $) {
    'use strict';

    /**
     * Defines interface and 'intelligent' guesses intended behaviour for dropdown
     *
     * <h4>Usage</h4>
     *
     *
     * <h5>Single Static Example using trigger</h5>
     *
     * <p>Will create a dropdown instance using the content in the DOM for content</p>
     *
     * <h6>HTML</h6>
     *
     * <pre>
     *  <a href="#" class="drop-menu">
     *  <div class="aui-dropdown-content">
     *      <ul class='aui-list'>
     *          <li><a href="http://www.gmail.com">Item 1</a></li>
     *          <li><a href="http://www.gmail.com">Item 1</a></li>
     *      </ul>
     *  </div>
     * </pre>
     *
     * <h6>JavaScript</h5>
     * require(["jquery", "jira/ajs/layer/layer-constants", "jira/ajs/dropdown/dropdown-options-descriptor"], function($, Constants, OptionsDescriptor) {
     *     new OptionsDescriptor({
     *         trigger: $(".drop-menu"),
     *         alignment: Constants.RIGHT
     *     });
     * });
     *
     * <h5>Multiple Static Example using dropdown content</h5>
     *
     * <p>Will create a dropdown instance using the content in the DOM for content</p>
     *
     * <h6>HTML</h6>
     *
     * <pre>
     *  <a href="#" class="drop-menu">
     *  <div class="aui-dropdown-content">
     *      <ul class='aui-list'>
     *          <li><a href="http://www.gmail.com">Item 1</a></li>
     *          <li><a href="http://www.gmail.com">Item 1</a></li>
     *      </ul>
     *  </div>
     *  <a href="#" class="drop-menu">
     *  <div class="my-content aui-dropdown-content">
     *      <ul class='aui-list'>
     *          <li><a href="http://www.gmail.com">Item 1</a></li>
     *          <li><a href="http://www.gmail.com">Item 1</a></li>
     *      </ul>
     *  </div>
     * </pre>
     *
     * <h6>JavaScript</h5>
     * require(["jira/ajs/layer/layer-constants", "jira/ajs/dropdown/dropdown-options-descriptor"], function(Constants, OptionsDescriptor) {
     *     new OptionsDescriptor({
     *         content: ".my-content",
     *         alignment: Constants.RIGHT
     *     });
     * });
     *
     * <h5>Multiple Ajax Example</h5>
     *
     * <p>Will create a dropdown instance using the content in the DOM for content</p>
     *
     * <h6>HTML</h6>
     *
     * <pre>
     *  <a href="/mycontenttoinject.html" class="ajax-drop-menu">
     *  <a href="/mycontenttoinject.html" class="ajax-drop-menu">
     * </pre>
     *
     * <h6>JavaScript</h5>
     * require(["jira/ajs/layer/layer-constants", "jira/ajs/dropdown/dropdown-options-descriptor"], function(Constants, OptionsDescriptor) {
     *     new OptionsDescriptor({
     *         trigger: ".my-content",
     *         alignment: Constants.RIGHT
     *     });
     * });
     *
     * <h5>Multiple Ajax Example with options</h5>
     *
     * <p>Will create a dropdown instance using the content in the DOM for content</p>
     *
     * <h6>HTML</h6>
     *
     * <pre>
     *  <a href="#" class="ajax-drop-menu">
     *  <a href="#" class="ajax-drop-menu">
     * </pre>
     *
     * <h6>JavaScript</h5>
     * require(["jira/ajs/layer/layer-constants", "jira/ajs/dropdown/dropdown-options-descriptor", "jquery"], function(Constants, OptionsDescriptor, $) {
     *     new OptionsDescriptor({
     *         trigger: ".my-content",
     *         alignment: Constants.LEFT,
     *         ajaxOptions: {
     *             url: "/myjsonresource.json",
     *             dataType: "json",
     *             formatResults: function (responseData) {
     *                  // here we construct a jQuery object to return;
     *                  return $("<div/>").text(responseData.blah);
     *             }
     *         }
     *     });
     * });
     *
     * @class Dropdown.OptionsDescriptor
     * @extends Descriptor
     */

    return Descriptor.extend({

        /**
         * Validates descriptor and intelligent guesses undefined properties
         * @constructs
         * @override
         */
        init: function init(properties) {

            this._super(properties);

            if (!this.content() && !this.trigger()) {
                throw new Error("Dropdown.OptionsDescriptor: expected either [content] or [trigger] to be defined.");
            }

            if (this.trigger() && !this.content()) {
                this.content(this.trigger().next(Constants.CONTENT_SELECTOR));
            } else if (this.content() && !this.trigger()) {
                this.content(this.trigger().next(Constants.TRIGGER_SELECTOR));
            }

            if (this.trigger() && !this.content()) {

                if (!this.ajaxOptions()) {
                    if (this.trigger().attr("href")) {
                        this.ajaxOptions(this.trigger().attr("href"));
                    }
                } else if (!this.ajaxOptions().url) {
                    this.ajaxOptions().url = this.trigger().attr("href");
                }

                this.contentRetriever(new AjaxContentRetriever(this.ajaxOptions()));
            } else if (this.content()) {
                if ($.isFunction(this.content())) {
                    this.contentRetriever(new DeferredContentRetriever(this.content()));
                } else {
                    this.contentRetriever(new DOMContentRetriever(this.content()));
                }
            }

            if (!this.listController()) {
                this.listController(new ListItemGroup());
            }
        },

        /**
         * Sets defaults, overridden with properties supplied to constructor
         *
         * @protected
         * @return {Object}
         */
        _getDefaultOptions: function _getDefaultOptions() {
            return {
                trigger: null,
                ajaxOptions: null,
                autoScroll: true,
                stopTriggerClickPropagation: false,
                stopEscapePropagation: true
            };
        },

        /**
         * Sets/Gets content, this is the element that will be appended to the dropdown.
         *
         * @param {String | HTMLElement | jQuery} content
         * @return {undefined | jQuery}
         */
        content: function content(_content) {
            if (_content) {
                _content = $(_content);
                if (_content.length) {
                    this.properties.content = _content;
                }
            } else {
                return this.properties.content;
            }
        },

        /**
         * Sets/Gets trigger, this is the element that when clicked will open dropdown.
         *
         * Note:
         * If the trigger is a link and dropdown content (an element matching {@see AJS.Dropdown.CONTENT_SELECTOR}) is not
         * found as the element after trigger in DOM, dropdown will assume you want to use AJAX to create dropdown. It will
         * request the url in the link and append the server response as the dropdown content. You can modifiy the server
         * response by setting a [formatSuccess] function in the ajaxOptions property.
         *
         * @param {String | HTMLElement | jQuery} trigger
         * @return {undefined | jQuery}
         */
        trigger: function trigger(_trigger) {
            if (_trigger) {
                this.properties.trigger = _trigger;
            } else {
                return this.properties.trigger;
            }
        },

        /**
         * Sets/Gets content retriever. A content retriever is an object that defines the mechanisms for retrieving content.
         * It is possible to define your own content retriever. As long as the object defines specific methods. You can look
         * at {@see DOMContentRetriever} as an example
         *
         * @param {AjaxContentRetriever | DOMContentRetriever | *} contentRetriever
         */
        contentRetriever: function contentRetriever(_contentRetriever) {
            if (_contentRetriever) {
                this.properties.contentRetriever = _contentRetriever;
            } else {
                return this.properties.contentRetriever;
            }
        },

        /**
         * Sets/Gets list controller. A list controller is an object that defines the mechanisms for navigating the items
         * in the dropdown. This includes keyboard navigation, hovers and selection.
         *
         * @param listController
         */
        listController: function listController(_listController) {
            if (_listController) {
                this.properties.listController = _listController;
            } else {
                return this.properties.listController;
            }
        },

        /**
         * Sets/Gets property determining if first item in list is focused on show
         *
         * @param focusFirstItem
         */
        focusFirstItem: function focusFirstItem(_focusFirstItem) {
            if (_focusFirstItem) {
                this.properties.focusFirstItem = _focusFirstItem;
            } else {
                return this.properties.focusFirstItem;
            }
        },

        /**
         * Sets/gets autoScroll property.
         *
         * @param {*=} autoScroll
         */
        autoScroll: function autoScroll(_autoScroll) {
            if (typeof _autoScroll !== "undefined") {
                this.properties.autoScroll = !!_autoScroll;
            }
            return this.properties.autoScroll;
        },

        /**
         * Sets/Gets ajaxOptions. If ajaxOptions is a string it will treat it as the url for the request.
         *
         * @param {String | Object} ajaxOptions
         */
        ajaxOptions: function ajaxOptions(_ajaxOptions) {
            if (_ajaxOptions) {
                this.properties.ajaxOptions = _ajaxOptions;
            } else {
                return this.properties.ajaxOptions;
            }
        },

        /**
         * Sets/Gets loop option. Defines whether to loop to top of list when navigation to the next item from bottom and
         * vice versa.
         *
         * @param {Boolean} loop
         */
        loop: function loop(_loop) {
            if (typeof _loop !== "undefined") {
                this.properties.loop = _loop;
            } else {
                return this.properties.loop;
            }
        },

        /**
         * Sets/Gets alignment. Defines alignment of dropdown
         *
         * @param {LayerConstants.LEFT | LayerConstants.RIGHT} alignment
         */
        alignment: function alignment(_alignment) {
            if (_alignment) {
                this.properties.alignment = _alignment;
            } else {
                return this.properties.alignment;
            }
        },

        /**
         * Sets/Gets eventDelegator. All keyboard events will be bound to this element
         *
         * @param {jQuery} eventDelegator
         */
        eventDelegator: function eventDelegator(_eventDelegator) {
            if (typeof _eventDelegator !== "undefined") {
                this.properties.eventDelegator = _eventDelegator;
            } else {
                return this.properties.eventDelegator;
            }
        },

        /**
         * Sets/Gets stopClickEventPropagation. If true the click event coming from the trigger won't be propagated
         *
         * @param {boolean} stopClickEventPropagation
         */
        stopTriggerClickPropagation: function stopTriggerClickPropagation(_stopTriggerClickPropagation) {
            if (typeof _stopTriggerClickPropagation !== "undefined") {
                this.properties.stopTriggerClickPropagation = _stopTriggerClickPropagation;
            } else {
                return this.properties.stopTriggerClickPropagation;
            }
        },

        /**
         * Sets/Gets stopEscapePropagation. If true the escape keydown event won't be propagated
         *
         * @param {boolean} stopEscapePropagation
         */
        stopEscapePropagation: function stopEscapePropagation(_stopEscapePropagation) {
            if (typeof _stopEscapePropagation !== "undefined") {
                this.properties.stopEscapePropagation = _stopEscapePropagation;
            } else {
                return this.properties.stopEscapePropagation;
            }
        }
    });
});

AJS.namespace('AJS.Dropdown.OptionsDescriptor', null, require('jira/ajs/dropdown/dropdown-options-descriptor'));
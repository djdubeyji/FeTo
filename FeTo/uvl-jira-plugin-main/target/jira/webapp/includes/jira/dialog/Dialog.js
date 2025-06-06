var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

define('jira/dialog/dialog', ['require'], function (require) {
    'use strict';

    var DialogStack = require('jira/dialog/dialog-stack');
    var Control = require('jira/ajs/control');
    var InlineLayer = require('jira/ajs/layer/inline-layer');
    var Meta = require('jira/util/data/meta');
    var SmartAjax = require('jira/ajs/ajax/smart-ajax');
    var Loading = require('jira/loading/loading');
    var XSRF = require('jira/xsrf');
    var Browser = require('jira/util/browser');
    var Events = require('jira/util/events');
    var Navigator = require('jira/util/navigator');
    var AuiDropdown = require('aui/dropdown');
    var jQuery = require('jquery');
    var Deferred = require('jira/jquery/deferred');
    var DirtyForm = require('jira/jquery/plugins/isdirty');
    var _ = require('underscore');
    var wrmRequire = require('wrm/require');
    var keyCodes = require('jira/util/key-code');
    var bindAJS = AJS.bind;
    var unbindAJS = AJS.unbind;
    var dimAJS = AJS.dim;
    //ONE CANNOT DO THIS BECAUSE IssueNav overwrites AJS.undim function
    //(there is a problem with focus after undim)
    //var undimAJS = AJS.undim;
    var layerAJS = AJS.layer;
    var LayerManager = AJS.LayerManager.global;

    /**
     * @class Dialog
     * @extends Control
     */
    var Dialog = Control.extend({

        _getDefaultOptions: function _getDefaultOptions() {
            return {
                height: "auto",
                cached: false,
                widthClass: "medium",
                modeless: false,
                ajaxOptions: {
                    data: {
                        inline: true,
                        decorator: "dialog"
                    }
                },
                shouldFocusTitleOnLoad: false
            };
        },

        /**
         * @constructs
         * @param {Object} options
         */
        init: function init(options) {

            if (typeof options === "string" || options instanceof jQuery) {
                options = {
                    trigger: options
                };
            } else if (options && options.width) {
                options.widthClass = "custom";
            }

            this.classNames = Dialog.ClassNames;
            this.OPEN_DIALOG_SELECTOR = "." + this.classNames.DIALOG + "." + this.classNames.DIALOG_OPEN;
            this.options = jQuery.extend(true, this._getDefaultOptions(), options);
            this.options.width = Dialog.WIDTH_PRESETS[this.options.widthClass] || options.width;
            this._setType();

            if (this.options.trigger) {
                // Trigger option might be a single string, an object or an array. We'll always convert triggers to an array.
                var triggerArray = jQuery.makeArray(this.options.trigger);
                var instance = this;
                jQuery.each(triggerArray, function (index, trigger) {
                    instance._assignEvents("trigger", trigger);
                });
            }

            this.onContentReadyCallbacks = [];

            this.initModeless();

            this.defineResources();

            if (this.options.prefetchResources) {
                this.downloadResources();
            }
        },

        _setType: function _setType() {
            if (typeof this.options.content === "function") {
                this.options.type = "builder";
            } else if (this.options.content instanceof jQuery || _typeof(this.options.content) === "object" && this.options.nodeName) {
                this.options.type = "element";
            } else if (!this.options.type && !this.options.content || _typeof(this.options.content) === "object" && this.options.content.url) {
                this.options.type = "ajax";
            }
        },

        _handleFocusOnLoad: function _handleFocusOnLoad() {
            if (this.options.shouldFocusTitleOnLoad) {
                this.focusTitle();
            } else {
                this.focusFirstInteractiveElement();
            }
        },

        initModeless: function initModeless() {
            this.options.modeless = !!this.options.modeless;

            if (this.options.modeless) {
                if (false === this.options.windowTitle) {
                    // This is necessary for keeping proper window title when using modal & modeless dialogs simultaneously
                    this.options.windowTitle = document.title;
                }

                // Cooperate well with AJS dialog
                this._temporarilyHidden = false;

                this._auiDialogShowHandler = this._auiDialogHandlers.hideTemporarily.bind(this);
                this._auiDialogHideHandler = this._auiDialogHandlers.restoreVisibility.bind(this);
                this._auiDialogRemoveHandler = this._auiDialogHandlers.restoreVisibilityRebindable.bind(this);
                bindAJS("show.dialog", this._auiDialogShowHandler);
                bindAJS("hide.dialog", this._auiDialogHideHandler);
                bindAJS("remove.dialog", this._auiDialogRemoveHandler);
                if (AJS.dialog2) {
                    this._auiDialog2ShowHandler = this._auiDialog2Handlers.hideTemporarily.bind(this);
                    this._auiDialog2HideHandler = this._auiDialog2Handlers.restoreVisibility.bind(this);
                    AJS.dialog2.on("show", this._auiDialog2ShowHandler);
                    AJS.dialog2.on("hide", this._auiDialog2HideHandler);
                }
            }
        },

        _runContentReadyCallbacks: function _runContentReadyCallbacks() {
            var that = this;
            jQuery.each(this.onContentReadyCallbacks, function () {
                this.call(that);
            });
        },

        /**
         * This is called to set new content into the Popup.  if the decorate flag is false then
         * it will not be decorated.
         *
         * @param {String | jQuery | HTMLElement} content - the content to place in the Popup
         * @param {Boolean} decorate - whether to decorate.  If undefined then decoration will take place
         */
        _setContent: function _setContent(content, decorate) {
            var node;

            if (this.resourcesReady().state() !== "resolved") {
                this._showloadingIndicator();
                this.resourcesReady().done(this._setContent.bind(this, content, decorate));
                return;
            }

            if (!content) {
                this._contentRetrievers[this.options.type].call(this, this._setContent);
            } else if (DialogStack.current === this) {
                this.get$popup().show().css("visibility", "hidden").addClass("popup-width-" + this.options.widthClass);

                this.$content = content;

                this.get$popupContent().html(content);

                if (decorate !== false) {
                    if (this.decorateContent) {
                        this.decorateContent();
                    }
                }

                // Promote any nested HEADING_AREA in to the actual heading location.
                if ((node = this.get$popupContent().find("." + this.classNames.HEADING_AREA)).size() > 0) {
                    this.get$popupHeading().replaceWith(node);
                }

                // Remove any nested CONTENT_AREA nodes.
                if ((node = this.get$popupContent().find("." + this.classNames.CONTENT_AREA)).size() > 0) {
                    node.contents().insertAfter(node); // Pull the content of the nested area out of itself.
                    node.remove(); // This will remove any user-bound events on this DOM node. Should be using delegates or the decorateContent method!
                }

                this._positionInCenter();

                if (decorate !== false) {
                    jQuery(document).trigger("dialogContentReady", [this]);
                    this._runContentReadyCallbacks();
                }

                this.get$popup().css("visibility", "");

                if (decorate !== false) {
                    if (jQuery.isFunction(this.options.onContentRefresh)) {
                        this.options.onContentRefresh.call(this);
                    }
                }
                this._onShowContent();
            } else if (this.options.cached === false) {
                delete this.$content;
            }
        },

        focusFirstInteractiveElement: function focusFirstInteractiveElement() {
            this.get$popup().find(":focusable:not([tabindex='-1']):first").focus();
        },

        focusTitle: function focusTitle() {
            this.get$popup().find("h2").focus();
        },

        _ellipsify: function _ellipsify(context) {
            if (!(context instanceof jQuery)) {
                context = this.get$popup();
            }
            // Ellipsify dynamically loaded content
            jQuery(".overflow-ellipsis", context).textOverflow({
                className: "ellipsified"
            });
        },

        /**
         * This is called when the original AJAX 'complete' code path is taken with a serverIsDone = true.
         *
         * @param data the response body
         * @param xhr the AJAX bad boy
         * @param smartAjaxResult the smart AJAX result object we need
         */
        _handleInitialDoneResponse: function _handleInitialDoneResponse(data, xhr, smartAjaxResult) {}, //eslint-disable-line no-unused-vars

        /**
         * Gets request url from trigger
         */
        getRequestUrlFromTrigger: function getRequestUrlFromTrigger() {
            if (this.$activeTrigger && this.$activeTrigger.length) {
                return this.$activeTrigger.attr("href") || this.$activeTrigger.data("url");
            }
        },

        /**
         * Gets request options
         */
        _getRequestOptions: function _getRequestOptions() {

            var options = {};
            if (this._getAjaxOptionsObject() === false) {
                return false;
            }
            // copy to prevent setting url into the original options object
            options = jQuery.extend(true, options, this._getAjaxOptionsObject());

            if (!options.url) {
                options.url = this.getRequestUrlFromTrigger();
            }
            return options;
        },

        _getAjaxOptionsObject: function _getAjaxOptionsObject() {
            var ajaxOpts = this.options.ajaxOptions;
            if (jQuery.isFunction(ajaxOpts)) {
                return ajaxOpts.call(this);
            } else {
                return ajaxOpts;
            }
        },

        _contentRetrievers: {

            "element": function element(callback) {
                if (!this.$content) {
                    this.$content = jQuery(this.options.content).clone(true);
                }
                callback.call(this, this.$content);
            },

            "builder": function builder(callback) {
                var instance = this;
                if (!this.$content) {
                    this._showloadingIndicator();
                    this.options.content.call(this, function (content) {
                        instance.$content = jQuery(content);
                        callback.call(instance, instance.$content);
                    }, function () {
                        instance._hideloadingIndicator();
                    });
                }
            },

            "ajax": function ajax(callback) {
                var instance = this;
                var ajaxOptions;
                if (!this.$content) {
                    ajaxOptions = this._getRequestOptions();
                    this._showloadingIndicator();
                    this.serverIsDone = false;

                    ajaxOptions.complete = function (xhr, textStatus, smartAjaxResult) {
                        if (smartAjaxResult.successful) {
                            //
                            // Check the status of the X-Atlassian-Dialog-Control header to see if we need to redirect
                            //
                            var instructions = instance._detectRedirectInstructions(xhr);
                            instance.serverIsDone = instructions.serverIsDone;
                            if (instructions.redirectUrl) {
                                //
                                // this will reload the page  and hence stop all processing
                                //
                                instance._performRedirect(instructions.redirectUrl);
                            } else {

                                if (ajaxOptions.dataType && ajaxOptions.dataType.toLowerCase() === "json" && instance._buildContentFromJSON) {
                                    instance.$content = instance._buildContentFromJSON(smartAjaxResult.data);
                                } else {
                                    instance.$content = smartAjaxResult.data;
                                }

                                if (instance.serverIsDone) {
                                    instance._handleInitialDoneResponse(smartAjaxResult.data, xhr, smartAjaxResult);
                                } else {
                                    callback.call(instance, instance.$content);
                                }
                            }
                        } else {
                            var errorContent = SmartAjax.buildDialogErrorContent(smartAjaxResult);
                            callback.call(instance, errorContent);
                        }
                    };
                    SmartAjax.makeRequest(ajaxOptions);
                }
            }
        },

        /**
         * This method will look for the magic header instructions from JIRA and set variables accordingly
         *
         * Returns a tuple value indicating what the instructions are :
         *
         *  {
         *      serverIsDone : boolean - will be set to true if the header is present
         *      redirectUrl : string - will be set to a value if the redirect instruction is given
         *  }
         *
         * @param xhr the AJAX bad boy
         * @return a tuple with instructions
         */
        _detectRedirectInstructions: function _detectRedirectInstructions(xhr) {
            var instructions = {
                serverIsDone: false,
                redirectUrl: ""
            };
            var doneHeader = xhr.getResponseHeader('X-Atlassian-Dialog-Control');
            if (doneHeader) {
                instructions.serverIsDone = true;
                var idx = doneHeader.indexOf("redirect:");
                if (idx === 0) {
                    instructions.redirectUrl = doneHeader.substr("redirect:".length);
                } else if (doneHeader === "permissionviolation") {
                    //We have been logged out. Reload the page which will redirect the user to the login page
                    //with a redirect to where the dialog was launched.
                    instructions.redirectUrl = window.location.href;
                }
            }
            return instructions;
        },

        /**
         * This will redirect the page to the specified url
         * @param url {String} the url to redirect to
         */
        _performRedirect: function _performRedirect(url) {
            Browser.reloadViaWindowLocation(url);
        },

        _renders: {

            popupHeading: function popupHeading() {
                var $el = jQuery("<div />");
                return $el.addClass(this.classNames.HEADING_AREA).addClass("jira-dialog-core-heading");
            },

            popupContent: function popupContent() {
                return jQuery("<div />").addClass(this.classNames.CONTENT_AREA).addClass("jira-dialog-core-content");
            },

            popup: function popup() {
                return jQuery("<div />").attr({
                    id: this.options.id || "",
                    "aria-labelledby": (this.options.id || "dialog") + "-title",
                    role: "dialog",
                    "aria-modal": true
                }).addClass(this.classNames.DIALOG).addClass("jira-dialog-core").toggleClass(this.classNames.MODELESS_DIALOG, this.options.modeless).hide();
            }
        },

        _events: {
            "trigger": {
                simpleClick: function simpleClick(e, item) {
                    this.$activeTrigger = item;

                    // If the trigger isn't an <a>, look for one underneath it.
                    if (!this.$activeTrigger.is("a")) {
                        this.$activeTrigger = item.find("a");
                    }
                    this.show();
                    e.preventDefault();
                }
            },

            "container": {
                "keydown": function keydown(e) {
                    // TODO JDEV-28437 - Bind this behaviour via keyboard shortcut.
                    if (e.which === keyCodes.ESCAPE) {
                        var aborted = this.handleCancel();

                        //JRADEV-8081: IE has the annoying habit to clear the input field when hitting ESC. We preventDefault() here
                        // when the cancel was aborted to prevent this.
                        if (Navigator.isIE() && Navigator.majorVersion() < 12 && aborted === false) {
                            e.preventDefault();
                        }
                    }
                    if (e.keyCode === keyCodes.TAB) {
                        DialogStack.current._watchTab(e);
                    }
                }
            }
        },

        handleCancel: function handleCancel() {
            return this.hide(true, { reason: Dialog.HIDE_REASON.escape });
        },

        _showloadingIndicator: function _showloadingIndicator() {
            Loading.showLoadingIndicator();
        },

        _hideloadingIndicator: function _hideloadingIndicator() {
            Loading.hideLoadingIndicator();
        },

        _positionInCenter: function _positionInCenter() {
            var $window = jQuery(window);
            var $popup = this.get$popup();
            var $container = this.getContentContainer();
            var $contentArea = this.getContentArea();
            var cushion = 40;
            var windowHeight = $window.height();
            var top = 0;

            if (typeof this.options.width === "number") {
                $popup.width(this.options.width);
            }

            if (!this.options.modeless) {
                $popup.css({
                    marginLeft: -$popup.outerWidth() / 2,
                    marginTop: Math.max(-$popup.outerHeight() / 2, cushion - windowHeight / 2)
                });

                var el = $popup[0];
                while (el) {
                    top += el.offsetTop;
                    el = el.offsetParent;
                }
            } else {
                top = Math.round(windowHeight / 2);
            }

            var popupMaxHeight = Math.max(windowHeight - top - cushion, Dialog.CONSTRAINTS.MODELESS_MIN_HEIGHT);
            var padding = parseInt($contentArea.css("padding-top"), 10) + parseInt($contentArea.css("padding-bottom"), 10);

            $contentArea.css("maxHeight", "");

            var contentMaxHeight = popupMaxHeight - ($popup.outerHeight() - $container.outerHeight()) - padding;

            $contentArea.css('maxHeight', contentMaxHeight);

            jQuery(this).trigger("contentMaxHeightChanged", [contentMaxHeight]);
        },

        /**
         * Gets scrollable content area. A max height will be applied to these areas
         */

        getContentArea: function getContentArea() {
            return this.$popup.find(".form-body");
        },

        /**
         * Gets content container. Should wrap all content areas, used to calculated max height for content areas.
         */
        getContentContainer: function getContentContainer() {
            var $container = this.$popup.find(".content-area-container");

            if ($container.length === 1) {
                return $container;
            } else {
                return this.$popup.find(".form-body");
            }
        },

        get$popup: function get$popup() {
            if (!this.$popup) {
                this.$popup = this._render("popup").appendTo("body");
                this.$popup.addClass("box-shadow");
            }
            return this.$popup;
        },

        /**
         * Specifies that the supplied links should be loaded, when clicked, inside the dialog
         *
         * @param {jQuery} $anchors
         */
        bindAnchorsToDialog: function bindAnchorsToDialog($anchors) {
            var instance = this;
            $anchors.click(function (e) {
                instance.$activeTrigger = jQuery(this);
                delete instance.$content;
                instance._setContent();
                e.preventDefault();
            });
        },

        get$popupContent: function get$popupContent() {
            if (!this.$popupContent) {
                this.$popupContent = this._render("popupContent").appendTo(this.get$popup());
            }
            return this.$popupContent;
        },

        get$popupHeading: function get$popupHeading() {
            if (!this.$popupHeading) {
                this.$popupHeading = this._render("popupHeading").prependTo(this.get$popup());
            }
            return this.$popupHeading;
        },

        getLoadingIndicator: function getLoadingIndicator() {
            return this.get$popupContent().find(".throbber:last");
        },

        showFooterLoadingIndicator: function showFooterLoadingIndicator() {
            var $throbber = this.getLoadingIndicator();

            if ($throbber.length) {
                if (!$throbber.data("spinner")) {
                    $throbber.addClass("loading").spin();
                } else if (!$throbber.hasClass("loading")) {
                    $throbber.addClass("loading"); // do not remove the spinner
                }
            }
        },

        hideFooterLoadingIndicator: function hideFooterLoadingIndicator() {
            var $throbber = this.getLoadingIndicator();

            if ($throbber.length) {
                // defer the removal to avoid animation restarting when we show spinner just after hiding it.
                $throbber.removeClass("loading");
                _.defer(function () {
                    if (!$throbber.hasClass("loading")) {
                        $throbber.spinStop();
                    }
                });
            }
        },

        _watchTab: function _watchTab(e) {
            var $dialog_selectable;
            var $first_selectable;
            var $last_selectable;

            // make sure we are still in the dialog.
            if (jQuery(e.target).parents(this.get$popupContent()).length > 0) {
                $dialog_selectable = jQuery(':focusable:visible:not([tabindex="-1"])', this.OPEN_DIALOG_SELECTOR);
                $first_selectable = $dialog_selectable.first();
                $last_selectable = $dialog_selectable.last();

                if (e.target === $first_selectable[0] && e.shiftKey || e.target === $last_selectable[0] && !e.shiftKey) {
                    if (e.shiftKey) {
                        $last_selectable.focus();
                    } else {
                        $first_selectable.focus();
                    }
                    e.preventDefault();
                }
            }
        },

        _hideCurrentInlineLayer: function _hideCurrentInlineLayer() {
            //Fix this when JRADEV-2814 is done.
            if (InlineLayer.current) {
                InlineLayer.current.hide();
            }
        },

        _hideCurrentAuiDropdown: function _hideCurrentAuiDropdown() {
            if (AuiDropdown.current) {
                AuiDropdown.current.hide();
            }
        },

        /**
         * Actually does the show of dialog
         * @private
         */
        _show: function _show(forceReload) {
            this._hideCurrentInlineLayer();
            this._hideCurrentAuiDropdown();

            var curr = DialogStack.current;
            if (curr) {
                var prev;
                if (curr.options.stacked) {
                    prev = curr;
                    prev.stacked = true;
                    prev.hide(false);

                    this.prev = prev;
                } else {
                    DialogStack.stackroot = this;

                    var current = DialogStack.current;
                    prev = current._removeStackState();
                    current.hide(false);

                    //Unstack the dialogs.
                    while (prev) {
                        current = prev;
                        prev = current._removeStackState();
                        current._destroyIfNecessary();
                    }
                }
            } else if (this.stacked !== true) {
                DialogStack.stackroot = this;
                DialogStack.originalWindowTitle = document.title;
            }

            if (!this.options.modeless) {
                if (this.prev && this.prev.options.modeless) {
                    // previous dialog could be modeless so one has to show the blanket
                    dimAJS(false);
                } else if (this.stacked !== true) {
                    //If we are stacked then the dim has already been applied.
                    dimAJS(false);
                }
            }

            DialogStack.current = this;

            var $popup = this.get$popup().addClass(this.classNames.DIALOG_OPEN);

            //Content is cached when stacked, so lets treat it as such, unless we have been told explicitly to reload content.
            if (forceReload || this.options.type !== "blank" && !this.$content && this.stacked !== true) {
                delete this.$content;
                this._setContent();
            } else {
                $popup.show();
                this._positionInCenter();
                this._onShowContent();
            }

            // bind behaviours
            this._assignEvents("container", document);
            // fire show events
            jQuery(this).trigger("Dialog.show", [this.$popup, this, this.id]);
            Events.trigger("Dialog.show", [this.$popup, this, this.id]);

            if (!this.options.modeless) {
                Browser.disableKeyboardScrolling(); // stop up and down keys scrolling page under popup
            }

            this._handleFocusOnLoad();

            //We are no longer stacked.
            this.stacked = false;
        },

        /**
         * Shows dialog, allowing for deferred to be executed before dialog is opened JRADEV-11211
         *
         * @return {Boolean}
         */
        show: function show(forceReload) {
            var delayShow = this.options.delayShowUntil;
            var instance = this;

            if (DialogStack.current === this) {
                return false;
            }

            var localBeforeShowEvent = new jQuery.Event("beforeShow");
            var globalBeforeShowEvent = new jQuery.Event("beforeShow");
            jQuery(this).trigger(localBeforeShowEvent);
            Events.trigger(globalBeforeShowEvent, [this.options.id]);

            if (localBeforeShowEvent.isDefaultPrevented() || globalBeforeShowEvent.isDefaultPrevented()) {
                return false;
            }

            this.downloadResources();

            if (delayShow) {
                var promise = delayShow();

                if (promise.state() === "resolved") {
                    instance._show(forceReload);
                } else {
                    if (!this.options.modeless) {
                        dimAJS(false);
                    }
                    this._showloadingIndicator();
                    promise.done(function () {
                        instance._show(forceReload);
                    });
                }
            } else {
                instance._show(forceReload);
            }
        },

        _setWindowTitle: function _setWindowTitle() {
            var titleOption = this.options.windowTitle;
            var $container = this.get$popup();
            var dialogTitle;
            var $heading;

            if (titleOption === false) {
                return;
            } else if (typeof titleOption === "string") {
                dialogTitle = titleOption;
            } else if (typeof titleOption === "function") {
                dialogTitle = titleOption.call(this);
            } else {
                $heading = $container.find("." + this.classNames.HEADING_AREA);
                if ($heading.length) {
                    dialogTitle = $heading.text();
                }
            }
            if (!dialogTitle) {
                return;
            }

            var jiraTitle = Meta.get("app-title");
            var newTitle = [dialogTitle];

            if (jiraTitle) {
                newTitle.push(jiraTitle);
            }

            document.title = newTitle.join(" - ");
        },

        /**
         * This method is called when the content is shown. This is different from the "show dialog" event which may be fired
         * before the AJAX call to get content has returned. This is called once the final dialog content has been "shown"
         * to the user.
         */
        _onShowContent: function _onShowContent() {
            this._setWindowTitle();
            this._hideloadingIndicator();
            this._ellipsify();
            this.get$popup().addClass(this.classNames.CONTENT_READY);
        },

        _resetWindowTitle: function _resetWindowTitle() {
            //No need to rest the title when stacked. Keep the current title. The next dialog
            //will need to set its title if necessary.
            if (this.stacked !== true && DialogStack.stackroot === this) {
                if (DialogStack.originalWindowTitle) {
                    if (document.title !== DialogStack.originalWindowTitle) {
                        document.title = DialogStack.originalWindowTitle;
                    }
                    DialogStack.originalWindowTitle = undefined;
                }
            }
        },

        notifyOfNewContent: function notifyOfNewContent() {
            if (this.$content) {
                this.decorateContent(); // Make sure title is updated
                this._positionInCenter(); // our content height might have changed so take up available realestate
                this._onShowContent();
                jQuery(document).trigger("dialogContentReady", [this]);
            }
        },

        destroy: function destroy() {
            if (this.options.modeless) {
                // Cooperate well with AJS dialogs
                if (AJS.dialog2) {
                    AJS.dialog2.off("show", this._auiDialog2ShowHandler);
                    AJS.dialog2.off("hide", this._auiDialog2HideHandler);
                    delete this._auiDialog2ShowHandler;
                    delete this._auiDialog2HideHandler;
                }
                unbindAJS("show.dialog", this._auiDialogShowHandler);
                unbindAJS("hide.dialog", this._auiDialogHideHandler);
                unbindAJS("remove.dialog", this._auiDialogRemoveHandler);
                delete this._auiDialogShowHandler;
                delete this._auiDialogHideHandler;
                delete this._auiDialogRemoveHandler;
            }

            this.$popup && this.$popup.remove();
            delete this.$popup;
            delete this.$popupContent;
            delete this.$popupHeading;
            delete this.$content;
        },

        _destroyIfNecessary: function _destroyIfNecessary() {
            !this.options.cached && this.destroy();
        },
        _removeStackState: function _removeStackState() {
            var prev = this.prev;

            delete this.prev;
            delete this.stacked;

            return prev;
        },
        isCurrent: function isCurrent() {
            return DialogStack.current === this;
        },
        // eslint-disable-next-line complexity
        hide: function hide(undim, options) {

            if (DialogStack.current !== this) {
                return;
            }

            var globalBeforeHideEvent = new jQuery.Event("Dialog.beforeHide");
            var localBeforeHideEvent = new jQuery.Event("Dialog.beforeHide");
            options = options || {};

            Events.trigger(globalBeforeHideEvent, [this.$popup, options.reason, this.options.id]);
            jQuery(this).trigger(localBeforeHideEvent, [this.$popup, options.reason, this.options.id]);

            if (globalBeforeHideEvent.isDefaultPrevented() || localBeforeHideEvent.isDefaultPrevented()) {
                return false;
            }

            this._updateXSRFToken();

            if (undim !== false && !this.prev && !this.options.modeless || this.prev && this.prev.options.modeless) {
                AJS.undim();
            }

            this.get$popup().removeClass(this.classNames.DIALOG_OPEN).removeClass(this.classNames.CONTENT_READY).hide();
            this._hideloadingIndicator();
            this._resetWindowTitle();

            // unassign event handlers
            this._unassignEvents("container", document);
            // fire hide events
            jQuery(document).trigger("hideAllLayers", [this.$popup, options.reason, this.options.id]);
            jQuery(this).trigger("Dialog.hide", [this.$popup, options.reason, this.options.id]);
            Events.trigger("Dialog.hide", [this.$popup, options.reason, this.options.id]);

            DialogStack.current = null;

            if (this.options.cached === false && this.stacked !== true) {
                this.destroy();
            }

            if (!this.options.modeless) {
                Browser.enableKeyboardScrolling(); // allow up and down keys to scroll page again
            }

            //Show the previous dialog unless we are also about to be stacked.
            if (this.stacked !== true) {
                if (this.prev) {
                    this.prev.show(!!this.prev.options.reloadOnPop);
                    delete this.prev;
                } else if (DialogStack.stackroot === this) {
                    DialogStack.stackroot = undefined;
                }
            }
        },
        _updateXSRFToken: function _updateXSRFToken() {
            var atlToken = jQuery("input[name=atl_token]", this.OPEN_DIALOG_SELECTOR).attr("value");
            if (atlToken !== undefined) {
                XSRF.updateTokenOnPage(atlToken);
            }
        },
        addHeading: function addHeading(heading) {
            var $pieces = jQuery("<div />").html(heading).contents();
            var $title = jQuery("<h2 tabindex='-1' />");
            $title.attr("id", (this.options.id || "dialog") + "-title");
            var contents = [];
            $pieces.each(function () {
                if (this.nodeName.toLowerCase() === "div") {
                    contents.push(this);
                } else {
                    $title.append(this);
                }
            });
            this.get$popupHeading().html(contents).prepend($title);
        },

        onContentReady: function onContentReady(func) {
            if (jQuery.isFunction(func)) {
                this.onContentReadyCallbacks.push(func);
            }
        },
        _auiDialogHandlers: {
            hideTemporarily: function hideTemporarily() {
                if (this._temporarilyHidden) {
                    return;
                }
                this._hideTemporarily();
            },
            restoreVisibility: function restoreVisibility() {
                if (!this._temporarilyHidden) {
                    return;
                }

                // check for AJS.dialog2
                var dialog2El = LayerManager.getTopLayer();
                var layer = !!dialog2El && layerAJS(dialog2El);
                if (layer && layer.isVisible() && layer.isBlanketed()) {
                    return;
                }

                this._restoreVisibility();
            },
            restoreVisibilityRebindable: function restoreVisibilityRebindable(ev, data) {
                this._restoreVisibility(ev, data);

                var rebindRemoveHandler = function rebindRemoveHandler() {
                    bindAJS("remove.dialog", this._auiDialogRemoveHandler);
                };
                // bind handler to "remove.dialog" again because GH unbind all handlers from this event
                //  and we need to do this after already stacked events (after unbind in GH)
                setTimeout(rebindRemoveHandler.bind(this), 0);
            }
        },
        _auiDialog2Handlers: {
            hideTemporarily: function hideTemporarily() {
                if (this._temporarilyHidden) {
                    return;
                }
                this._hideTemporarily();
            },
            restoreVisibility: function restoreVisibility() {
                if (!this._temporarilyHidden) {
                    return;
                }
                // check for AJS.Dialog
                if (AJS.popup.current && AJS.popup.current.element.is(":visible")) {
                    return;
                }

                // check for AJS.dialog2
                var topLayer = AJS.LayerManager.global.getTopLayer();

                if (topLayer) {
                    return;
                }

                this._restoreVisibility();
            }
        },
        _hideTemporarily: function _hideTemporarily() {
            this.get$popup().addClass(this.classNames.DIALOG_NOT_VISIBLE);
            this._temporarilyHidden = true;
        },
        _restoreVisibility: function _restoreVisibility() {
            this.get$popup().removeClass(this.classNames.DIALOG_NOT_VISIBLE);
            this._temporarilyHidden = false;
        },

        // Resources API

        /**
         * Override this function to define resources in component init. Remember to call super in your implementation.
         * @abstract
         */
        defineResources: function defineResources() {
            if (_.isFunction(this.options.defineResources)) {
                this.options.defineResources.call(this);
            }
        },

        requireContext: function requireContext(contextName) {
            this.requireResource(contextName, 'wrc!');
        },

        requireResource: function requireResource(resourceName, prefix) {
            this.wrmResources = this.wrmResources || [];

            this.wrmResources.push((prefix || 'wr!') + resourceName);
        },

        getRequiredResources: function getRequiredResources() {
            return this.wrmResources || [];
        },

        downloadResources: function downloadResources() {
            if (this.getRequiredResources().length > 0 && !this.deferredResources) {
                this.deferredResources = wrmRequire(this.getRequiredResources());
            }
        },

        resourcesReady: function resourcesReady() {
            if (this.deferredResources) {
                return this.deferredResources.promise();
            } else {
                return new Deferred().resolve().promise();
            }
        }
    });

    /**
     * Applies dirty form warnings to dialogs
     *
     * Usage:
     * var myDialog = new JIRA.FormDialog({...});
     * myDialog.dirtyFormWarning(); // bind dirty form warning behaviour
     */
    Dialog.fn.dirtyFormWarning = function () {
        return this.bind("Dialog.beforeHide", function (e, popup, hideReason) {
            if (!e.isDefaultPrevented() && (hideReason === Dialog.HIDE_REASON.cancel || hideReason === Dialog.HIDE_REASON.escape)) {
                var dirtyMessage = DirtyForm.getDirtyWarning();
                if (dirtyMessage && !confirm(dirtyMessage)) {
                    e.preventDefault();
                }
            }
        });
    };

    Dialog.ClassNames = {
        DIALOG: "jira-dialog",
        HEADING_AREA: "jira-dialog-heading",
        CONTENT_AREA: "jira-dialog-content",
        DIALOG_OPEN: "jira-dialog-open",
        CONTENT_READY: "jira-dialog-content-ready",
        MODELESS_DIALOG: "jira-dialog-modeless",
        DIALOG_NOT_VISIBLE: "jira-dialog-not-visible"
    };

    Dialog.WIDTH_PRESETS = {
        small: 360,
        medium: 540,
        large: 810
    };

    Dialog.CONSTRAINTS = {
        MODELESS_MIN_HEIGHT: 240
    };

    Dialog.HIDE_REASON = {
        cancel: "cancel",
        escape: "esc",
        submit: "submit"
    };

    // legacy: support for .current prop (should be removed in the future)
    Object.defineProperty(Dialog, 'current', {
        get: function get() {
            console.warn(DialogStack.currentDeprecationMsg);
            return DialogStack.current;
        },
        set: function set(newValue) {
            console.warn(DialogStack.currentDeprecationMsg);
            DialogStack.current = newValue;
        }
    });

    return Dialog;
});

/** Preserve legacy namespace
    @deprecated AJS.FlexiPopup */
AJS.namespace("AJS.FlexiPopup", null, require('jira/dialog/dialog'));
AJS.namespace('JIRA.Dialog', null, require('jira/dialog/dialog'));
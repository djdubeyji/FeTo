var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

define('jira/dialog/dialog2', ['require'], function (require) {
    'use strict';

    var DialogStack = require('jira/dialog/dialog-stack');
    var dialog2 = require('aui/dialog2');
    var Control = require('jira/ajs/control');
    var InlineLayer = require('jira/ajs/layer/inline-layer');
    var Meta = require('jira/util/data/meta');
    var SmartAjax = require('jira/ajs/ajax/smart-ajax');
    var Loading = require('jira/loading/loading');
    var XSRF = require('jira/xsrf');
    var Browser = require('jira/util/browser');
    var Events = require('jira/util/events');
    var AuiDropdown = require('aui/dropdown');
    var jQuery = require('jquery');
    var Deferred = require('jira/jquery/deferred');
    var DirtyForm = require('jira/jquery/plugins/isdirty');
    var _ = require('underscore');
    var wrmRequire = require('wrm/require');
    var keyCodes = require('jira/util/key-code');
    var dimAJS = AJS.dim;
    var LayerManager = AJS.LayerManager.global;

    /**
     * @class Dialog
     * @extends Control
     */
    var Dialog = Control.extend({

        _getDefaultOptions: function _getDefaultOptions() {
            return {
                cached: false,
                widthClass: "medium",
                ajaxOptions: {
                    data: {
                        inline: true,
                        decorator: "dialog"
                    }
                }
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
            this.OPEN_DIALOG_SELECTOR = Dialog.getSelector("DIALOG") + Dialog.getSelector("DIALOG_OPEN");
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

        _getDialogSelector: function _getDialogSelector() {
            if (!this.options.id) {
                this.options.id = "new-dialog-id";
                this.get$popup().attr('id', this.options.id);
            }
            return '#' + this.options.id;
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
                this.$content = content;

                this.get$popupContent().html(content);

                if (decorate !== false) {
                    if (this.decorateContent) {
                        this.decorateContent();
                    }
                }

                if (!this.get$popup().find('.' + this.classNames.FOOTER_AREA).length) {
                    var $legacyFooter = this.get$popup().find('.buttons');

                    this.moveFooterToDialog2($legacyFooter);
                } else if (this.get$popupContent().find('.' + this.classNames.FOOTER_AREA).length) {
                    // Check if the footer is inside the content - then promote it outside the main content area.
                    this.get$popup().append(this.get$popupContent().find('.' + this.classNames.FOOTER_AREA));
                }

                // Promote any nested HEADING_AREA in to the actual heading location.
                if ((node = this.get$popupContent().find('.' + this.classNames.HEADING_AREA.split(' ').join('.'))).size() > 0) {
                    this.get$popupHeading().replaceWith(node);
                }

                // Remove any nested CONTENT_AREA nodes.
                if ((node = this.get$popupContent().find('.' + this.classNames.CONTENT_AREA.split(' ').join('.'))).size() > 0) {
                    node.contents().insertAfter(node); // Pull the content of the nested area out of itself.
                    node.remove(); // This will remove any user-bound events on this DOM node. Should be using delegates or the decorateContent method!
                }

                if (decorate !== false) {
                    jQuery(document).trigger("dialogContentReady", [this]);
                    this._runContentReadyCallbacks();
                }

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

        moveFooterToDialog2: function moveFooterToDialog2($footerContainer) {
            if (!$footerContainer || !$footerContainer.length) {
                return;
            }

            this.get$popup().children('footer').eq(0).remove();

            var $footer = jQuery('<footer class="' + this.classNames.FOOTER_AREA + '"></footer>');
            $footer.append($footerContainer);
            this.get$popup().append($footer);

            var form = this.get$popupContent().find('form');
            var submit = $footerContainer.find('[type="submit"]');

            var formId = form.attr('id') || 'dialog-form';
            form.attr('id', formId);
            submit.attr('form', formId);
        },

        _initAuiDialog2: function _initAuiDialog2() {
            dialog2(this._getDialogSelector()).show();

            // Replace both listeners with plugging into AUI's beforeHide event when AUI-5273 is done
            this._listenOnAuiBlanket();
            this._listenOnEscape();
        },

        _listenOnAuiBlanket: function _listenOnAuiBlanket() {
            var _this = this;

            jQuery('.aui-blanket').on('click.' + this._getNamespace(), function (e) {
                e.stopImmediatePropagation();
                _this.handleCancel();
            });
        },

        _listenOnEscape: function _listenOnEscape() {
            var _this2 = this;

            jQuery('body').off('keydown.' + this._getNamespace());

            jQuery('body').on('keydown.' + this._getNamespace(), function (e) {
                var topLayer = LayerManager.getTopLayer();

                if (topLayer && (topLayer[0] && topLayer[0].nodeName === 'AUI-INLINE-DIALOG' || topLayer.hasClass('wiki-edit-dropdown') || topLayer.hasClass('wiki-edit-picker'))) {
                    return;
                }

                if (e.keyCode === keyCodes.ESCAPE) {
                    e.stopPropagation();
                    _this2.handleCancel();
                }
            });
        },

        _getNamespace: function _getNamespace() {
            return this._getDialogSelector().substring(1);
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
        // eslint-disable-next-line no-unused-vars
        _handleInitialDoneResponse: function _handleInitialDoneResponse(data, xhr, smartAjaxResult) {},

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

                                if (!instance.serverIsDone) {
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
                var $el = jQuery("<header />");
                return $el.addClass(this.classNames.HEADING_AREA);
            },

            popupContent: function popupContent() {
                return jQuery("<div />").addClass(this.classNames.CONTENT_AREA);
            },

            popup: function popup() {
                var dialog = jQuery("<section />").attr("id", this.options.id || "").addClass(this.classNames.DIALOG).attr("role", "dialog").attr("aria-labelledby", "jira-dialog2__heading").hide();
                this._setDialogSize(dialog);

                return dialog;
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
            }
        },

        handleCancel: function handleCancel() {
            var reason = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Dialog.HIDE_REASON.escape;

            return this.hide(true, { reason: reason });
        },

        _showloadingIndicator: function _showloadingIndicator() {
            Loading.showLoadingIndicator();
        },

        _hideloadingIndicator: function _hideloadingIndicator() {
            Loading.hideLoadingIndicator();
        },

        _setDialogSize: function _setDialogSize(dialog) {
            var sizeClass = this._getDialogSizeClass(this.options.width);
            if (dialog && !dialog.hasClass(sizeClass)) {
                dialog.addClass(sizeClass);
            }
        },

        _getDialogSizeClass: function _getDialogSizeClass(width) {
            switch (true) {
                case width <= 400:
                    return "aui-dialog2-small";
                case width <= 600:
                    return "aui-dialog2-medium";
                default:
                    return "aui-dialog2-large";
            }
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
            return this.get$popup().find(".throbber:last");
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

        /**
         * Actually does the show of dialog
         * @private
         */
        _show: function _show(forceReload) {
            //Fix this when JRADEV-2814 is done.
            if (InlineLayer.current) {
                InlineLayer.current.hide();
            }

            if (AuiDropdown.current) {
                AuiDropdown.current.hide();
            }
            var curr = DialogStack.current;
            if (curr) {
                var prev;
                if (curr.options.stacked) {
                    prev = curr;
                    prev.stacked = true;

                    this.prev = prev;
                } else {
                    DialogStack.stackroot = this;

                    prev = curr._removeStackState();
                    curr.hide(false);

                    //Unstack the dialogs.
                    while (prev) {
                        curr = prev;
                        prev = curr._removeStackState();
                        curr._destroyIfNecessary();
                    }
                }
            } else if (this.stacked !== true) {
                DialogStack.stackroot = this;
                DialogStack.originalWindowTitle = document.title;
            }

            if (this.stacked !== true) {
                //If we are stacked then the dim has already been applied.
                dimAJS(false);
            }

            DialogStack.current = this;

            var $popup = this.get$popup().addClass(this.classNames.DIALOG_OPEN);

            //Content is cached when stacked, so lets treat it as such, unless we have been told explicitly to reload content.
            if (forceReload || this.options.type !== "blank" && !this.$content && this.stacked !== true) {
                delete this.$content;
                this._setContent();
            } else {
                $popup.show();
                this._onShowContent();
                dialog2(this._getDialogSelector()).show();
            }

            // bind behaviours
            this._assignEvents("container", document);
            // fire show events
            jQuery(this).trigger("Dialog.show", [this.$popup, this, this.id]);
            Events.trigger("Dialog.show", [this.$popup, this, this.id]);

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
                    dimAJS(false);
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
            this._initAuiDialog2();
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
                this._setDialogSize(this.get$popup()); // our content height might have changed so take up available realestate
                this._onShowContent();
                jQuery(document).trigger("dialogContentReady", [this]);
            }
        },

        destroy: function destroy() {
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

            jQuery('.aui-blanket').off('click.' + this._getNamespace());
            jQuery('body').off('keydown.' + this._getNamespace());

            var atlToken = jQuery("input[name=atl_token]", this.OPEN_DIALOG_SELECTOR).attr("value");
            if (atlToken !== undefined) {
                XSRF.updateTokenOnPage(atlToken);
            }

            dialog2(this._getDialogSelector()).hide();

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

            //Show the previous dialog unless we are also about to be stacked.
            if (this.stacked !== true) {
                if (this.prev) {
                    this.prev.show(!!this.prev.options.reloadOnPop);
                    this.prev._listenOnAuiBlanket();
                    delete this.prev;
                } else if (DialogStack.stackroot === this) {
                    DialogStack.stackroot = undefined;
                }
            }
        },
        addHeading: function addHeading(heading) {
            var $pieces = jQuery("<div/>").html(heading).contents();
            var $title = jQuery("<h2/>").attr("id", "jira-dialog2__heading");
            var contents = [$title];
            $pieces.each(function () {
                if (this.nodeName.toLowerCase() === "div") {
                    contents.push(this);
                } else {
                    $title.append(this);
                }
            });
            this.get$popupHeading().html(contents);
            $title.attr('title', jQuery.trim($title.text()));
        },

        onContentReady: function onContentReady(func) {
            if (jQuery.isFunction(func)) {
                this.onContentReadyCallbacks.push(func);
            }
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
        DIALOG: "aui-dialog2 aui-layer jira-dialog2 jira-dialog-core",
        HEADING_AREA: "aui-dialog2-header jira-dialog-core-heading",
        CONTENT_AREA: "aui-dialog2-content jira-dialog-core-content",
        FOOTER_AREA: "aui-dialog2-footer",
        DIALOG_OPEN: "jira-dialog-open",
        CONTENT_READY: "jira-dialog-content-ready"
    };

    Dialog.getSelector = function (container) {
        var firstClass = (Dialog.ClassNames[container] || '').split(' ')[0];
        return firstClass ? '.' + firstClass : '';
    };

    Dialog.WIDTH_PRESETS = {
        small: 360,
        medium: 540,
        large: 810
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
define('jira/dialog/form-dialog2', ['jira/util/formatter', 'jira/dialog/dialog2', 'jira/flag', 'jira/message', 'jira/ajs/ajax/smart-ajax', 'jira/focus/set-focus', 'jira/util/browser', 'jira/util/events', 'jquery', 'jira/libs/parse-uri'], function (formatter, Dialog, Flag, Messages, SmartAjax, SetFocus, Browser, Events, jQuery, parseUri) {
    'use strict';

    /**
     * @class FormDialog
     * @extends Dialog
     */

    return Dialog.extend({

        defineResources: function defineResources() {
            this._super.apply(this, arguments);

            if (this.isIssueDialog()) {
                this.requireContext("jira.edit.issue");
            }
        },

        _getDefaultOptions: function _getDefaultOptions() {
            return jQuery.extend(this._super(), {
                autoClose: false,
                targetUrl: "",
                refreshOnSubmit: true,
                onUnSuccessfulSubmit: function onUnSuccessfulSubmit() {},
                onSuccessfulSubmit: function onSuccessfulSubmit() {},

                /**
                 * By default if we have been told by the markup to go to a specific URL, then we do
                 * otherwise we reload the current page by going to it again.
                 * @ignore
                 */
                onDialogFinished: function onDialogFinished() {

                    // Always close the dialog before attempting to unload the page, in case
                    // dirty-form or some other onunload check blocks it. Be sure to get the target ftirst,
                    // though, because it's stored in the dialog's DOM and is lost when the dialog is hidden.
                    var targetUrl = this._getTargetUrlValue();

                    this.hide();

                    if (targetUrl) {
                        Events.trigger('page-unload.location-change.from-dialog', [this.$popup]);
                        window.location.href = targetUrl;
                    } else if (this.options.refreshOnSubmit) {
                        Events.trigger('page-unload.refresh.from-dialog', [this.$popup]);
                        Browser.reloadViaWindowLocation();
                    }
                },

                submitAjaxOptions: {
                    type: "post",
                    data: {
                        inline: true,
                        decorator: "dialog"
                    },
                    dataType: "html"
                },

                isIssueDialog: false
            });
        },

        _getFormDataAsObject: function _getFormDataAsObject() {
            var fieldValues = {};
            // save form configuration to user prefs
            jQuery(this.$form.serializeArray()).each(function () {
                var fieldVal = fieldValues[this.name];
                if (!fieldVal) {
                    fieldVal = this.value;
                } else if (jQuery.isArray(fieldVal)) {
                    fieldVal.push(this.value);
                } else {
                    fieldVal = [fieldVal, this.value];
                }
                fieldValues[this.name] = fieldVal;
            });
            return fieldValues;
        },

        _getRelativePath: function _getRelativePath() {
            var ajaxOptions = this._getRequestOptions();
            return parseUri(ajaxOptions.url).directory;
        },

        _getPath: function _getPath(action) {
            var relPath = this._getRelativePath();
            if (action.indexOf(relPath) === 0) {
                return action;
            } else {
                return relPath + action;
            }
        },

        _submitForm: function _submitForm(e) {
            this.cancelled = false;
            this.xhr = null;
            this.redirected = false;
            this.serverIsDone = false;

            var instance = this;
            var defaultRequestOptions = jQuery.extend(true, {}, this.options.submitAjaxOptions);

            var requestOptions = jQuery.extend(true, defaultRequestOptions, {
                url: this._getPath(this.$form.attr("action")),
                data: this._getFormDataAsObject(),
                complete: function complete(xhr, textStatus, smartAjaxResult) {
                    instance.hideFooterLoadingIndicator();

                    if (!instance.cancelled) {
                        instance._showMessagesFromXhrResponse(xhr);
                        if (smartAjaxResult.successful) {
                            instance.$form.trigger("fakesubmit");
                            instance._handleServerSuccess(smartAjaxResult.data, xhr, textStatus, smartAjaxResult);
                            //
                            // if we have already been redirected then the page is asynchronously unloading and going elsewhere
                            // and hence we should not do the complete processing since its pointless and could only do harm
                            //
                            if (!instance.redirected) {
                                instance._handleSubmitResponse(smartAjaxResult.data, xhr, smartAjaxResult);
                            }
                        } else {
                            instance._handleServerError(xhr, textStatus, smartAjaxResult.errorThrown, smartAjaxResult);
                        }
                    }
                    //The form may have changed. Lets just make sure there us no 'submitting' class to be extra sure.
                    instance.$form.removeClass("submitting");
                }
            });

            // and since we're a dialog, and since web actions don't offer responses tailored to the accepts header, we should always set these request options:
            requestOptions.data.decorator = "dialog";
            requestOptions.data.inline = true;

            this.showFooterLoadingIndicator();

            this.xhr = SmartAjax.makeRequest(requestOptions);

            e.preventDefault();
        },

        _showMessagesFromXhrResponse: function _showMessagesFromXhrResponse(xhr) {
            var messagesJson = xhr.getResponseHeader('X-Atlassian-Messages');
            if (messagesJson) {
                var messages = JSON.parse(messagesJson);
                Flag.showMessages(messages);
            }
        },

        /**
         * This is called when the AJAX 'error' code path is taken.  It takes the response text and plonks it into
         * the dialog as content.
         *
         * @param xhr the AJAX bad boy
         * @param textStatus the status
         * @param errorThrown the error in play
         * @param smartAjaxResult the smart AJAX result object we need
         */
        _handleServerError: function _handleServerError(xhr, textStatus, errorThrown, smartAjaxResult) {
            if (this.options.onUnSuccessfulSubmit) {
                this.options.onUnSuccessfulSubmit.call(xhr, textStatus, errorThrown, smartAjaxResult);
            }
            // we stick this in as an error message at the top of the content if we can otherwise
            // we replace the content.  The former allows the form details to be saved via copy and paste
            // handy for really large comments say.  We only do this if we dont have any data to display
            var errorContent = SmartAjax.buildDialogErrorContent(smartAjaxResult, true);
            var content$ = this.get$popupContent().find(".form-body");
            if (content$.length !== 1) {
                content$ = this.get$popupContent();
            }
            var insertErrMsg = content$.length === 1 && !smartAjaxResult.hasData;
            if (insertErrMsg) {
                content$.prepend(errorContent);
            } else {
                this.setSubmitResponseContent(errorContent);
            }
        },

        /**
         * Appends content recieved after submission of form to dialog.
         *
         * @param content
         */
        setSubmitResponseContent: function setSubmitResponseContent(content) {

            if (this.options.formatSubmitResponseContent) {
                content = this.options.formatSubmitResponseContent.call(this, content);
            }
            this._setContent(content);
        },

        isIssueDialog: function isIssueDialog() {
            return !!this.options.isIssueDialog;
        },

        /**
         * This is called on the AJAX 'success' code path.  At this stage its a 200'ish message.
         *
         * If there is content and its has the magic 'redirect' we handle the redirect
         * then we will redirect to the specified place!
         *
         * @param xhr the AJAX bad boy
         * @param data the response body
         * @param textStatus the status
         * @param smartAjaxResult the smart AJAX result object we need
         */
        _handleServerSuccess: function _handleServerSuccess(data, xhr, textStatus, smartAjaxResult) {
            var msgInstructions = this._detectMsgInstructions(xhr);

            //
            // Check the status of the X-Atlassian-Dialog-Control header to see if we are done
            //
            var instructions = this._detectRedirectInstructions(xhr);
            this.serverIsDone = instructions.serverIsDone;

            if (msgInstructions) {
                // if we are going to redirect, then show message after the redirect happens
                if (instructions.redirectUrl || this._getTargetUrlValue() || this.options.refreshOnSubmit) {
                    Messages.showMsgOnReload(msgInstructions.msg, {
                        type: msgInstructions.type,
                        closeable: msgInstructions.closeable,
                        target: msgInstructions.target
                    });
                } else {
                    Messages.showMsg(msgInstructions.msg, {
                        type: msgInstructions.type.toLowerCase(),
                        closeable: msgInstructions.closeable,
                        target: msgInstructions.target
                    });
                }
            }

            if (instructions.redirectUrl) {
                if (this.options.onSuccessfulSubmit) {
                    this.options.onSuccessfulSubmit.call(this, data, xhr, textStatus, smartAjaxResult);
                }
                this._performRedirect(instructions.redirectUrl);
            } else if (!this.serverIsDone) {
                this.setSubmitResponseContent(data);
            }
        },

        _detectMsgInstructions: function _detectMsgInstructions(xhr) {
            var instructions = {
                msg: xhr.getResponseHeader("X-Atlassian-Dialog-Msg-Html")
            };

            if (instructions.msg) {
                instructions.type = xhr.getResponseHeader("X-Atlassian-Dialog-Msg-Type").toUpperCase();
                instructions.closeable = xhr.getResponseHeader("X-Atlassian-Dialog-Msg-Closeable") === "true";
                instructions.target = xhr.getResponseHeader("X-Atlassian-Dialog-Msg-Target");
                return instructions;
            }
        },

        /**
         * This is called when the original AJAX 'complete' code path is taken with a serverIsDone = true.
         *
         * @param data the response body
         * @param xhr the AJAX bad boy
         * @param smartAjaxResult the smart AJAX result object we need
         */
        _handleInitialDoneResponse: function _handleInitialDoneResponse(data, xhr, smartAjaxResult) {
            this._handleSubmitResponse(data, xhr, smartAjaxResult);
        },

        /**
         * This is called when the AJAX 'complete' code path is taken.
         *
         * @param data the response body
         * @param xhr the AJAX bad boy
         * @param smartAjaxResult the smart AJAX result object we need
         */
        _handleSubmitResponse: function _handleSubmitResponse(data, xhr, smartAjaxResult) {
            if (this.serverIsDone) {
                if (this.options.onSuccessfulSubmit) {
                    this.options.onSuccessfulSubmit.call(this, data, xhr, smartAjaxResult);
                }
                if (this.options.autoClose) {
                    this.hide();
                }
                if (this.options.onDialogFinished) {
                    this.options.onDialogFinished.call(this, data, xhr, smartAjaxResult);
                }
            }
        },

        /**
         * This will hide the dialog and redirect the page to the specified url
         * @param url {String} the url to redirect to
         */
        _performRedirect: function _performRedirect(url) {
            if (!this.options.stayVisibleOnRedirect) {
                this.hide();
            }
            this.redirected = true;
            this._super(url);
        },

        _hasTargetUrl: function _hasTargetUrl() {
            return this._getTargetUrlHolder().length > 0;
        },

        _getTargetUrlHolder: function _getTargetUrlHolder() {
            return jQuery(this.options.targetUrl);
        },

        _getTargetUrlValue: function _getTargetUrlValue() {
            return this._getTargetUrlHolder().val();
        },

        decorateContent: function decorateContent() {
            var instance = this;
            var $buttons;
            var $cancel;
            var $buttonContainer;
            var $footerContainer;
            var $closeLink;

            this.$form = jQuery("form", this.get$popupContent());
            this._constructHeading();

            this.$form.submit(function (e) {

                var event = new jQuery.Event("before-submit");
                instance.$form.trigger(event, [e, instance]);

                if (!event.isDefaultPrevented()) {
                    instance.$form.addClass("submitting");
                    var submitButtons = jQuery(':submit', instance);
                    submitButtons.attr('disabled', 'disabled');
                    if (instance.options.submitHandler) {
                        instance.showFooterLoadingIndicator();
                        instance.options.submitHandler.call(instance, e, function () {
                            if (instance.isCurrent()) {
                                instance.hideFooterLoadingIndicator();
                                //The form may have changed. Lets just make sure there us no 'submitting' class to be extra sure.
                                instance.$form.removeClass("submitting");
                            }
                        });
                    } else {
                        instance._submitForm(e);
                    }
                } else {
                    // still need to prevent submit
                    e.preventDefault();
                }
            });

            $cancel = jQuery(".cancel", this.get$popupContent());
            $cancel.click(function (e) {
                if (instance.xhr) {
                    instance.xhr.abort();
                }
                instance.xhr = null;
                instance.cancelled = true;
                instance.hide(true, { reason: Dialog.HIDE_REASON.cancel });
                e.preventDefault();
            });

            //if there's no buttons (i.e. when there's an error) then add a close link!
            $buttons = this.get$popupContent().find(".button, .aui-button");
            $buttonContainer = this.get$popupContent().find("div.buttons");
            if ($cancel.length === 0 && $buttons.length === 0) {
                if ($buttonContainer.length === 0) {
                    $footerContainer = jQuery('<div class="buttons-container form-footer"><div class="buttons"/></div>').appendTo(this.get$popupContent());
                    $buttonContainer = $footerContainer.find(".buttons");
                }

                AJS.populateParameters();
                $closeLink = jQuery("<button class='aui-button aui-button-link cancel' id='aui-dialog-close'>" + formatter.I18n.getText("admin.common.words.close") + "</button>");
                $buttonContainer.append($closeLink);

                $closeLink = jQuery(".cancel", this.get$popupContent());
                $closeLink.click(function (e) {
                    instance.hide(true, { reason: Dialog.HIDE_REASON.cancel });
                    e.preventDefault();
                });
            }
            $buttonContainer.prepend(jQuery("<span class='throbber'/>"));

            // Allow for opening of the keyboard shortcut dialog via help links in dialog contents.
            this.get$popupContent().on("click", ".shortcut-tip-trigger", function (e) {
                e.preventDefault();
                if (!instance.get$popupContent().isDirty() || confirm(formatter.I18n.getText("common.forms.dirty.dialog.message"))) {
                    instance.hide();
                    jQuery("#keyshortscuthelp").click();
                }
            });

            // Find the footer container
            if (!($footerContainer instanceof jQuery)) {
                $footerContainer = $buttonContainer.closest(".buttons-container, .form-footer");
                if (!$footerContainer.size()) {
                    $footerContainer = $buttonContainer;
                }
            }

            this.moveFooterToDialog2($footerContainer);

            // Returning footer container, as it's the one with the styles in dialogs.
            this.$buttonContainer = $footerContainer;
        },

        getButtonsContainer: function getButtonsContainer() {
            return this.$buttonContainer;
        },

        _constructHeading: function _constructHeading() {
            var $formHeading;
            var $formHeadingContainer;
            $formHeading = jQuery(":header:first", this.get$popupContent());
            if ($formHeading.length > 0) {
                // append to heading but retain event handlers
                this.addHeading($formHeading.contents());
                $formHeadingContainer = $formHeading.parent();
                $formHeading.remove();

                // Cull empty parent elements.
                while ($formHeadingContainer.is(":empty")) {
                    $formHeading = $formHeadingContainer.parent();
                    $formHeadingContainer.remove();
                    $formHeadingContainer = $formHeading;
                }
            }
        },

        hide: function hide(undim, options) {
            if (this._super(undim, options) === false) {
                return false;
            }

            SetFocus.popConfiguration();
        }
    });
});
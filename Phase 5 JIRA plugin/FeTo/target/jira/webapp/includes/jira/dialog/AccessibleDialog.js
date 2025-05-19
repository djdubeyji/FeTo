define('jira/dialog/accessible-dialog', ['jquery', 'aui/dialog'], function (jQuery, Dialog) {
    'use strict';

    /**
     * This is a wrapper component for AUI Dialog1, which fixes all of its accessibility issues
     * and provides some more options for making the accessibility in a dialog better.
     *
     * Please note this wrapper is created as a temporary solution, before we migrate all the dialogs
     * to use modern components like AUI Dialog2, which are already fully accessible.
     *
     * Using this component for implementing new dialogs is highly discouraged.
     *
     * @class AccessibleDialog
     * @extends AJS.Dialog1
     */

    var AccessibleDialog = function AccessibleDialog(options) {
        this.options = options;
        Dialog.call(this, options);
        if (options) {
            _setOnPageLoadFocusBehavior(this.getCurrentPage(), options.onPageLoadFocusBehavior);
        }
    };

    AccessibleDialog.prototype = Object.assign({}, Dialog.prototype);

    /**
     * Sets the focus behavior to execute when showing the page specified.
     * If no behavior provided, sets the default one - focus the page title.
     *
     * @param {Page} page Page to set the behavior for
     * @param {function} behavior [optional] Behavior to set
     */
    function _setOnPageLoadFocusBehavior(page, behavior) {
        if (behavior) {
            page.handleFocusOnLoad = behavior;
        } else {
            page.handleFocusOnLoad = AccessibleDialog.OnPageLoadFocusBehavior.Title;
        }
    }

    /**
     * Creates a keydown handler function for looping the focus order in a dialog
     * in order to create a focus trap.
     *
     * @param {string} dialogId The id of a dialog to handle the focus in
     */
    function _createFocusHandler(dialogId) {
        return function (e) {
            if (e.key !== "Tab") {
                return;
            }
            var activeElement = document.activeElement;
            var $dialogPage = jQuery("#" + dialogId).find(".dialog-components:visible");
            var focusableElements = $dialogPage.find(":focusable:not([tabindex='-1'])");
            var firstElement = focusableElements[0];
            var lastElement = focusableElements[focusableElements.length - 1];

            var isFirstInteractiveElementFocused = activeElement === firstElement || jQuery(activeElement).hasClass("dialog-title");
            var isDialogTitleFocused = jQuery(activeElement).hasClass("dialog-title");
            var isLastInteractiveElementFocused = activeElement === lastElement;

            if (e.shiftKey && (isFirstInteractiveElementFocused || isDialogTitleFocused)) {
                lastElement.focus();
                e.preventDefault();
            } else if (!e.shiftKey && isLastInteractiveElementFocused) {
                firstElement.focus();
                e.preventDefault();
            }
        };
    }

    /**
     * Removes hidden page menu elements that break the focus trap.
     *
     * @param {jQuery} $element The element to search for hidden menus in (usually, either a page or the entire dialog)
     */
    AccessibleDialog.prototype.removeHiddenPageMenu = function ($element) {
        $element.find(".dialog-page-menu[style*='display: none']").remove();
    };

    /**
     * Returns the current dialog page object.
     *
     * @returns Current dialog page object
     */
    AccessibleDialog.prototype.getCurrentPage = function () {
        return this.page[this.curpage];
    };

    /**
     * Returns the current page's title element.
     *
     * @returns Current page's title element
     */
    AccessibleDialog.prototype.get$CurrentPageTitle = function () {
        var $page = this.getCurrentPage().element;
        return $page.find(".dialog-title");
    };

    /**
     * Unbinds the keydown handler for creating a focus trap and
     * moves the focus to the element provided in dialog options.
     */
    AccessibleDialog.prototype._handleDialogHide = function () {
        document.removeEventListener("keydown", this.handleFocus);
        if (this.options && this.options.$elementToFocusOnClose) {
            this.options.$elementToFocusOnClose.focus();
        }
    };

    /**
     * Moves the focus to the first interactive element on the provided dialog's page.
     *
     * @param {jQuery} $page A page element
     */
    AccessibleDialog.prototype._focusFirstInteractiveElement = function ($page) {
        $page.find(":focusable:not([tabindex='-1']):first").focus();
    };

    /**
     * When navigating between pages, handles the focus accordingly to the provided behavior.
     */
    AccessibleDialog.prototype._handleFocusOnPageLoad = function () {
        this.getCurrentPage().handleFocusOnLoad(this);
    };

    /**
     * Shows the dialog if it is not visible.
     *
     * @returns {object} Current dialog object
    */
    AccessibleDialog.prototype.show = function () {
        var $dialog = this.popup.element;
        $dialog.addClass(AccessibleDialog.ClassNames.Dialog);
        this.popup.show();
        AJS.trigger("show.dialog", { dialog: this });

        this.handleFocus = _createFocusHandler(this.id);
        document.addEventListener("keydown", this.handleFocus);

        $dialog.attr({
            "aria-hidden": false,
            "aria-modal": true,
            role: "dialog"
        });

        // Linking a visible dialog title to the dialog element
        var $dialogTitle = this.get$CurrentPageTitle();
        $dialog.attr('aria-labelledby', $dialogTitle.attr("id"));

        // Removing redundant invisible buttons causing the focus trap to break
        this.removeHiddenPageMenu($dialog);

        // When a dialog is opened from a dropdown menu, the focus jumps
        // to the menu instead of the dialog, so we need to add a zero timeout
        setTimeout(function () {
            this._handleFocusOnPageLoad();
        }.bind(this));

        return this;
    };

    /**
     * Hides the dialog if it is visible.
     *
     * @returns {object} Current dialog object
    */
    AccessibleDialog.prototype.hide = function () {
        this.popup.hide();
        AJS.trigger("hide.dialog", { dialog: this });

        this._handleDialogHide();

        return this;
    };

    /**
     * Removes the dialog element from the DOM.
    */
    AccessibleDialog.prototype.remove = function () {
        Dialog.prototype.remove.call(this);

        this._handleDialogHide();
    };

    /**
     * Adds a header to the current page.
     *
     * @param {string} title Title text
     * @param {string} className [optional] CSS class name
     * @param {string} id [optional] CSS id
     * @returns {object} Current dialog object
    */
    AccessibleDialog.prototype.addHeader = function (title, className, id) {
        var currentPage = this.getCurrentPage();

        if (currentPage.header) {
            currentPage.header.remove();
        }

        var $pageHeader = jQuery("<div class='dialog-header'></div>");
        var $pageTitle = jQuery("<h1 class='dialog-title' tabindex='-1'></h1>").text(title || "");
        if (className) {
            $pageTitle.addClass(className);
        }

        var pageId = currentPage.element.attr("id");
        if (!id && pageId) {
            id = pageId + "-title";
        } else if (!id && !pageId) {
            id = this.popup.element.attr("id") + "-page-" + this.curpage + "-title";
        }
        $pageTitle.attr("id", id);
        this.popup.element.attr('aria-labelledby', id);

        $pageHeader.append($pageTitle);
        currentPage.element.prepend($pageHeader);
        currentPage.header = $pageHeader;
        currentPage.recalcSize();

        return this;
    };

    /**
     * Does all the required actions before using the current dialog's page:
     * - updates the aria-labelledby value;
     * - removes redundant hidden elements that break the focus trap;
     * - places the focus to the right place.
     */
    AccessibleDialog.prototype._makePageAccessible = function () {
        var $page = this.getCurrentPage().element;
        var $pageTitle = this.get$CurrentPageTitle();
        this.popup.element.attr('aria-labelledby', $pageTitle.attr("id"));
        this.removeHiddenPageMenu($page);
        this._handleFocusOnPageLoad();
    };

    /**
     * Making the previous page in hierarchy visible and active.
     *
     * @returns {object} Current dialog object
    */
    AccessibleDialog.prototype.prevPage = function () {
        Dialog.prototype.prevPage.call(this);
        this._makePageAccessible();
        return this;
    };

    /**
     * Making the next page in hierarchy visible and active.
     *
     * @returns {object} Current dialog object
    */
    AccessibleDialog.prototype.nextPage = function () {
        Dialog.prototype.nextPage.call(this);
        this._makePageAccessible();
        return this;
    };

    /**
     * Making the specified page visible and active.
     *
     * @param {number} num Page id
     * @returns {object} Current dialog object
    */
    AccessibleDialog.prototype.gotoPage = function (num) {
        Dialog.prototype.gotoPage.call(this, num);
        this._makePageAccessible();
        return this;
    };

    /**
     * Adds a new page to the dialog and sets the new page as the current page.
     *
     * @param {string} className [optional] HTML class name for the page element
     * @param {AccessibleDialog.OnPageLoadFocusBehavior} onLoadFocusBehavior [optional] A focus behavior
     *         to execute when showing the current page. If not provided, the focus moves to the page title element.
     * @returns Current dialog object
    */
    AccessibleDialog.prototype.addPage = function (className, onLoadFocusBehavior) {
        Dialog.prototype.addPage.call(this, className);
        _setOnPageLoadFocusBehavior(this.getCurrentPage(), onLoadFocusBehavior);
        return this;
    };

    /**
     * Updates height of panels, to contain content without the need for scroll bars.
     * Also handles the page focus logic to override the default Dialog1 behavior.
     */
    AccessibleDialog.prototype.updateHeight = function () {
        Dialog.prototype.updateHeight.call(this);
        this._handleFocusOnPageLoad();
    };

    AccessibleDialog.ClassNames = {
        Dialog: "jira-accessible-dialog"
    };

    /**
     * Defines some focus behaviors when navigating between pages, or showing the first one:
     *
     * - Title: the focus moves to the page title element;
     * - FirstInteractiveElement: the focus moves to the first interactive element on the page.
     */
    AccessibleDialog.OnPageLoadFocusBehavior = {
        Title: function Title(dialog) {
            dialog.get$CurrentPageTitle().focus();
        },
        FirstInteractiveElement: function FirstInteractiveElement(dialog) {
            dialog._focusFirstInteractiveElement(dialog.getCurrentPage().element);
        }
    };

    return AccessibleDialog;
});

AJS.namespace('JIRA.AccessibleDialog', null, require('jira/dialog/accessible-dialog'));
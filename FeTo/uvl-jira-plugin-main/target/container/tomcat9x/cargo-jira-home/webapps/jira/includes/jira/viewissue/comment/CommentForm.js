define('jira/viewissue/comment/comment-form', ['jira/util/formatter', 'jira/util/events', 'jira/util/events/types', 'jquery'], function (formatter, Events, Types, $) {
    'use strict';

    var commentForm = {
        /**
         * Cancels a comment. This means clearing the text area, resetting the
         * dirty state for the closes form, and collapsing the comment box.
         *
         * If comment preview mode is enabled, this function disables it before
         * attempting to clear the comment textarea.
         */
        setCaretAtEndOfCommentField: function setCaretAtEndOfCommentField() {
            var $field = this.getField();
            var field = $field[0];
            var length;
            if ($field.length) {
                length = $field.val().length;
                $field.scrollTop($field.attr("scrollHeight"));
                if (field.setSelectionRange && length > 0) {
                    field.setSelectionRange(length, length);
                }
            }
        },

        /**
         * Check if value has changed
         *
         * @return {Boolean}
         */
        isDirty: function isDirty() {
            var field = this.getField();
            if (field.length) {
                return field[0].value !== field[0].defaultValue;
            }
            return false;
        },

        /**
         * Construct a dirty comment warning if the comment form is dirty.
         *
         * @returns {string|undefined} A dirty comment warning or undefined.
         */
        handleBrowseAway: function handleBrowseAway() {
            // If the form isn't dirty, no point continuing.
            if (!commentForm.isDirty()) {
                return;
            }

            // If the form isn't visible, then don't show a dirty warning. This
            // is particularly important for the issue search single-page-app.
            var form = commentForm.getForm();
            var isVisible = form.length && form.is(":visible");

            if (isVisible) {
                return formatter.I18n.getText("common.forms.dirty.comment");
            }
        },

        setSubmitState: function setSubmitState() {
            if ($.trim(this.getField().val()).length > 0 && this.isVisibilityAvailble()) {
                this.getForm().find("#issue-comment-add-submit").removeAttr("disabled");
            } else {
                this.getForm().find("#issue-comment-add-submit").attr("disabled", "disabled");
            }
        },

        /**
         * Gets form from dom or cached one
         *
         * @return {jQuery}
         */
        getForm: function getForm() {
            var $form = $("form#issue-comment-add");
            if ($form.length === 1) {
                // on page load or panels have been refeshed and we have another comment form
                this.$form = $form;
            }
            return this.$form || $();
        },

        /**
         * Gets the comment textarea
         * @return {jQuery}
         */
        getField: function getField() {
            return this.getForm().find("#comment");
        },

        getSubmitButton: function getSubmitButton() {
            return this.getForm().find("#issue-comment-add-submit");
        },

        /**
         * Focuses form
         */
        show: function show() {
            this.focus();
            if (Types.LOCK_PANEL_REFRESHING) {
                // disable panel refreshing in kickass
                Events.trigger(Types.LOCK_PANEL_REFRESHING, ["addcommentmodule"]);
            }
        },

        /**
         * Focuses field and puts cursor at end of text
         */
        focus: function focus() {
            this.focusField();
            this.setCaretAtEndOfCommentField();
        },

        focusField: function focusField() {
            this.getField().focus().trigger("keyup");

            this.getSubmitButton().scrollIntoView({
                marginBottom: 200
            });
        }
    };

    return commentForm;
});

define('jira/viewissue/comment/footer-comment', ['jira/viewissue/comment/comment-form', 'jquery'], function (commentForm, $) {
    'use strict';

    var footerComment = {
        /**
         * Gets comment module
         * @return {jQuery}
         */
        getModule: function getModule() {
            return $("#addcomment");
        },

        /**
         * Is the comment area visible
         * @return {*}
         */
        isActive: function isActive() {
            return this.getModule().hasClass("active");
        },

        show: function show() {
            if (!this.isActive()) {
                this.getModule().addClass("active");
                this.appendForm();
                commentForm.show();
            } else {
                commentForm.focusField();
            }
        },
        /**
         * Appends form to correct location
         */
        appendForm: function appendForm() {
            this.getModule().find(".mod-content").append(commentForm.getForm());
        }
    };

    return footerComment;
});
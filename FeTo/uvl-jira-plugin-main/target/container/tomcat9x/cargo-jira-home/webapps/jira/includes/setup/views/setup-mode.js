define("jira/setup/setup-mode-view", ["jquery", "jira/backbone-1.3.3", "underscore", "jira/setup/setup-abstract-view", "jira/setup/setup-language-view"], function ($, Backbone, _, AbstractView, LanguageView) {

    var pageStorageKey = "jira.setup.mode.page";

    return AbstractView.extend({
        languageDialogSelector: "#jira-setup-language-dialog",
        pageStorageKey: pageStorageKey,

        ui: {
            languageDialogTrigger: ".jira-setup-language-dialog-trigger"
        },

        events: {
            "click @ui.languageDialogTrigger": "onLanguageDialogTriggerClick"
        },

        initialize: function initialize() {
            this.langDialog = AJS.dialog2(this.languageDialogSelector);
            this.languageView = new LanguageView({
                el: this.languageDialogSelector
            });

            this.listenTo(this.languageView, "cancel-requested", this.onLanguageViewCancelRequested);

            this.langDialog.on("show", _.bind(function () {
                this.languageView.showInitial();
                this.languageView.start();
            }, this));

            var choiceBoxValue = this.getPageDataKey("choiceBoxValue");
            if (choiceBoxValue) {
                this.selectChoiceBox(choiceBoxValue);
            }
        },

        onSubmit: function onSubmit() {
            this.ui.submitButton.enable(false);
        },

        onLanguageDialogTriggerClick: function onLanguageDialogTriggerClick() {
            this.openLanguageDialog();
        },

        openLanguageDialog: function openLanguageDialog() {
            if (this.langDialog) {
                this.langDialog.show();
            }
        },

        onLanguageViewCancelRequested: function onLanguageViewCancelRequested() {
            this.langDialog.hide();
        },

        onChoiceBoxValueChange: function onChoiceBoxValueChange($el) {
            AbstractView.prototype.onChoiceBoxValueChange.apply(this, arguments);
            this.ui.submitButton.attr('value', $el.data('choice-submit'));
        }
    }, { pageStorageKey: pageStorageKey });
});
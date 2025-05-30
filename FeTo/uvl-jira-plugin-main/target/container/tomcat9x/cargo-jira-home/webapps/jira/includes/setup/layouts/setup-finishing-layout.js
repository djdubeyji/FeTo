define("jira/setup/setup-finishing-layout", ["jquery", "jira/backbone-1.3.3", "underscore", "jira/setup/setup-abstract-view", "jira/setup/setup-finishing-notifications-view", "jira/setup/setup-finishing-summary-view", "jira/setup/setup-tracker"], function ($, Backbone, _, AbstractView, NotificationsView, SummaryView, setupTracker) {

    return AbstractView.extend({
        regions: {
            "contents": ".jira-setup-finishing-contents"
        },

        ui: {
            "contents": ".jira-setup-finishing-contents"
        },

        initialize: function initialize() {
            this._initializeRegions();

            var notificationsView = new NotificationsView();
            this.contents.attachView(notificationsView);

            this.listenTo(notificationsView, "setup-complete", this.onSetupComplete);

            window.onbeforeunload = function () {
                setTimeout(function onDialogDismissed() {
                    notificationsView.bootstrapStatePulling();
                }, 1);
                return JIRA.Templates.Setup.Finishing.navigationWarning();
            };

            this.contents.currentView.triggerSetup();
        },

        onSetupComplete: function onSetupComplete(data) {
            this.stopListening(this.contents.currentView);

            setupTracker.sendInstantSetupCompletedEvent({
                "SEN": data.SEN
            });

            setTimeout(_.bind(function () {
                window.onbeforeunload = null;
                this.contents.show(new SummaryView({
                    redirectUrl: data.redirectUrl
                }));
            }, this), 600);
        }
    });
});
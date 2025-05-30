/**
 * @module jira/setup/setup-database-view
 */
define("jira/setup/setup-database-view", ['jira/ajs/select/single-select', 'wrm/context-path', "jquery", "jira/backbone-1.3.3", "underscore", "jira/setup/setup-abstract-view", "jira/ajs/ajax/smart-ajax", "jira/setup/setup-tracker"], function (SingleSelect, wrmContextPath, $, Backbone, _, AbstractView, SmartAjax, setupTracker) {

    /**
     * @class
     * @extends module:jira/setup/setup-abstract-view
     * @alias module:jira/setup/setup-database-view
     */
    return AbstractView.extend({
        defaults: {
            "mssql": { port: "1433", schema: "dbo" },
            "mysql57": { port: "3306", schema: "" },
            "mysql8": { port: "3306", schema: "" },
            "oracle10g": { port: "1521", schema: "" },
            "postgres72": { port: "5432", schema: "public" },
            "postgresaurora96": { port: "5432", schema: "public" }
        },

        ui: {
            "dbMessages": ".db-message",
            "dbOption": "input[name=databaseOption]",
            "dbSpecificFields": ".db-specific-field",
            "dbType": "#jira-setup-database-field-database-type",
            "errorMessages": ".jira-setup-global-messages .aui-message-error",
            "externalDbFields": ".external-db-field",
            "externalDbFieldsArea": "#setup-db-external",
            "form": "#jira-setup-database",
            "globalMessages": ".jira-setup-global-messages",
            "port": "#jira-setup-database-field-port",
            "schema": "#jira-setup-database-field-schema",
            "submit": "#jira-setup-database-submit",
            "submitSpinner": ".submit-spinner",
            "successMessages": ".jira-setup-global-messages .aui-message-success",
            "testButton": "#jira-setup-database-test-connection",
            "testConnectionSpinner": ".test-connection-spinner",
            "testingConnection": "#jira-setup-database-field-testing-connection",
            "migrations": "#migrations",
            "connectingJiraToDB": "#connecting-jira-to-db"
        },

        events: {
            "change @ui.dbOption": "onDbOptionChangeWrapper",
            "change @ui.dbType": "onDbTypeChange",
            "click @ui.testButton": "onTestButtonPressed",
            "submit @ui.form": "onSubmit",
            "click @ui.migrations": "migrationsClicked",
            "click @ui.connectingJiraToDB": "connectingJiraToDBClicked"
        },

        templates: {
            "externalDbFields": JIRA.Templates.Setup.Database.externalDbFields,
            "globalMessages": JIRA.Templates.Setup.Database.globalMessages,
            "unableToTestConnection": JIRA.Templates.Setup.Database.unableToTestConnection
        },

        /**
         * Whether the form submission by browser was already prevented.
         */
        _previouslyPrevented: false,

        initialize: function initialize() {
            setupTracker.insert();

            this.bindUIElements();
            this.initAUIFields();

            this.onDbOptionChange();
            this.onDbTypeChange();
        },

        initAUIFields: function initAUIFields() {
            var classname = "aui-ss-select";

            if (!this.ui.dbType.hasClass(classname)) {
                new SingleSelect({
                    element: this.ui.dbType
                });
            }
        },

        renderExternalDbFieldsArea: function renderExternalDbFieldsArea(data) {
            this.ui.externalDbFieldsArea.html(this.templates.externalDbFields(data));

            this.bindUIElements();
        },

        /**
         * This is a wrapper for handler of database option change; it exists due to difference in expected
         * behavior for the event handling while in initialization phase and while reacting to user actions.
         */
        onDbOptionChangeWrapper: function onDbOptionChangeWrapper() {
            this.onDbOptionChange();

            this.cleanGlobalMessages();
        },

        onDbOptionChange: function onDbOptionChange() {
            var isHidden = this.ui.dbOption.filter(":checked").val() !== "external";

            this.ui.externalDbFieldsArea.toggleClass("hidden", isHidden);
            this.ui.testButton.toggleClass("hidden", isHidden);
        },

        onDbTypeChange: function onDbTypeChange() {
            this.adjustExternalDbFields(true);
        },

        adjustExternalDbFields: function adjustExternalDbFields(useDefaults) {
            var useDefaults = useDefaults === undefined ? true : useDefaults;
            var type = function (val) {
                return _.isArray(val) ? val[0] : val;
            }(this.ui.dbType.val());

            if (!type) {
                this.ui.dbMessages.addClass("hidden");
                this.ui.dbSpecificFields.addClass("hidden");
                return;
            }

            if (useDefaults) {
                this.ui.port.val(this.defaults[type].port);
                this.ui.schema.val(this.defaults[type].schema);
            }

            var classname = ".db-type-" + type;
            this.ui.dbSpecificFields.addClass("hidden").filter(classname).removeClass("hidden");
            this.ui.dbMessages.addClass("hidden").filter(classname).removeClass("hidden");
        },

        /**
         * In order to counteract a bug in Safari 7, namely DOM changes having no effect while handling form submission,
         * the following handler has to be invoked twice - for the very first time it prevents default browser behavior
         * so that DOM changes are rendered, then it triggers form submission again, allowing for it to be handled by
         * browser.
         *
         * @param e The jQuery event
         */
        onSubmit: function onSubmit(e) {
            if (this._previouslyPrevented) return true;

            e.preventDefault();
            this._previouslyPrevented = true;

            setupTracker.sendUserPickedDatabase(this.ui.dbOption.val());

            setTimeout(_.bind(function () {
                this.ui.form.submit();
            }, this), 0);

            // JRADEV-6428: Disable the language flags while PICO is starting up. If we don"t we can get deadlock if the
            // user clicks "next" on the DB screen and then clicks on a flag while the db is being setup.
            this.disallowFormSubmit();

            this.cleanGlobalMessages();

            this.ui.submitSpinner.removeClass("hidden");
        },

        disallowFormSubmit: function disallowFormSubmit() {
            this.ui.submit.prop("disabled", true);
            this.ui.testButton.prop("disabled", true);
        },

        allowFormSubmit: function allowFormSubmit() {
            this.ui.submit.prop("disabled", false);
            this.ui.testButton.prop("disabled", false);
        },

        cleanGlobalMessages: function cleanGlobalMessages() {
            this.ui.globalMessages.empty();
        },

        renderGlobalMessages: function renderGlobalMessages(data) {
            this.ui.globalMessages.html(this.templates.globalMessages(data));
            this.bindUIElements();
        },

        /**
         * Handle the case server returned no response or the response is invalid, not the case
         * data provided by user is invalid
         */
        handleTestConnectionError: function handleTestConnectionError() {
            this.ui.globalMessages.html(this.templates.unableToTestConnection());
            this.bindUIElements();
        },

        onTestButtonPressed: function onTestButtonPressed(e) {
            e.preventDefault();
            this.testConnection();
        },

        testConnection: function testConnection() {

            this.ui.testConnectionSpinner.removeClass("hidden");
            this.disallowFormSubmit();
            this.cleanGlobalMessages();

            SmartAjax.makeRequest({
                cache: false,
                data: this.ui.form.serialize(),
                dataType: "json",
                type: "GET",
                url: wrmContextPath() + "/secure/SetupDatabase!connectionCheck.jspa",
                success: _.bind(function (response) {
                    if (!response || !response.data) {
                        this.handleTestConnectionError();
                        return;
                    }

                    this.renderExternalDbFieldsArea(response.data);
                    this.renderGlobalMessages(response.data);
                }, this),
                error: _.bind(function () {
                    this.handleTestConnectionError();
                }, this),
                complete: _.bind(function () {
                    this.ui.testConnectionSpinner.addClass("hidden");
                    this.adjustExternalDbFields(false);
                    this.allowFormSubmit();
                    this.initAUIFields();
                }, this)
            });
        },

        migrationsClicked: function migrationsClicked() {
            setupTracker.sendUserClickedOnMigrationsLink();
        },

        connectingJiraToDBClicked: function connectingJiraToDBClicked() {
            setupTracker.sendUserClickedOnConnectingJiraToDatabaseLink();
        }
    });
});
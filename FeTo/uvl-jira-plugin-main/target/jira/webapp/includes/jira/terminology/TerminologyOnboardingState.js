/**
 * A helper module for managing state of terminology onboarding inline dialogs
 */
define('jira/terminology-onboarding-state', ['jira/data/local-storage'], function (jiraLocalStorage) {
    'use strict';

    var FIELD_DISMISS_KEYS = {
        sprint: 'jira.terminology.onboarding.dismissed.sprint',
        epic: 'jira.terminology.onboarding.dismissed.epic'
    };
    return {
        /**
         * Returns true if terminology onboarding dialog for given field was dismissed
         * @param {string} type - ['sprint' | 'epic']
         * @returns {boolean}
         */
        get: function get(type) {
            return JSON.parse(jiraLocalStorage.getItem(FIELD_DISMISS_KEYS[type]));
        },
        /**
         * Marks terminology onboarding for given field as dismissed
         * @param {string} type - ['sprint' | 'epic']
         */
        set: function set(type) {
            jiraLocalStorage.setItem(FIELD_DISMISS_KEYS[type], true);
        },
        /**
         * Returns true if terminology onboarding dialog for sprint was dismissed
         * @returns {boolean}
         */
        isSprintsDismissed: function isSprintsDismissed() {
            return this.get(FIELD_DISMISS_KEYS.sprint);
        },
        /**
         * Returns true if terminology onboarding dialog for epic was dismissed
         * @returns {boolean}
         */
        isEpicsDismissed: function isEpicsDismissed() {
            return this.get(FIELD_DISMISS_KEYS.epic);
        }
    };
});
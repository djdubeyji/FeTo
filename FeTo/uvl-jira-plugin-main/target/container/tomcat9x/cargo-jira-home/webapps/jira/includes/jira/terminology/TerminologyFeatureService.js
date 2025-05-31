/**
 * This module claims terminology data and caches it, so that it can be used by different components/features
 * without getting multiple claim error from wrmData.
 */
define('jira/terminology-feature-service', ['jira/featureflags/feature-manager', 'jira/util/data/meta', 'underscore', 'wrm/data'], function (featureFlagManager, meta, _, wrmData) {
    'use strict';

    var TERMINOLOGY_DATA = wrmData.claim('jira.core:terminology-data.terminology') || {};
    var terminologyEnabled = featureFlagManager.isFeatureEnabled('com.atlassian.jiranomenclature');

    return {
        /**
         * Returns all modified terminology entries
         * @returns {Array}
         */
        getTerminologyEntries: function getTerminologyEntries() {
            return _.where(TERMINOLOGY_DATA.terminologyEntries, { isDefault: false }) || [];
        },
        /**
         * Finds modified terminology entry for the given field if it exists
         * @param {string} type - ['sprint' | 'epic']
         * @returns {Object|undefined}
         */
        getTerminologyEntryForTerm: function getTerminologyEntryForTerm(type) {
            return _.findWhere(this.getTerminologyEntries(), {
                originalName: type,
                isDefault: false
            });
        },
        /**
         * Returns true if terminology feature flag is enabled
         * @returns {boolean}
         */
        isTerminologyEnabled: function isTerminologyEnabled() {
            return terminologyEnabled;
        },
        /**
         * Returns true if any term(s) have been changed on the instance using terminology feature
         * @returns {boolean}
         */
        isTerminologyChanged: function isTerminologyChanged() {
            return TERMINOLOGY_DATA.isTerminologyActive;
        },
        isEnglishLocale: function isEnglishLocale() {
            return meta.get('user-locale').indexOf('en') >= 0;
        },
        /**
         * Returns true if current user will see updated terms due to terminology feature
         * - feature flag needs to be enabled
         * - terminology needs to be changed by admin
         * - language should be english variant
         * @returns {boolean}
         */
        isTerminologyActiveForUser: function isTerminologyActiveForUser() {
            return this.isTerminologyEnabled() && this.isTerminologyChanged() && this.isEnglishLocale();
        }
    };
});
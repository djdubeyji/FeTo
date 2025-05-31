/**
 * Require this to check feature flags in javascript code.
 */
define("jira/featureflags/feature-manager", ['wrm/data', "exports"], function (wrmData, exports) {
    'use strict';

    // this has a mock in jira-components/jira-core/src/main/resources/js/setup-wrm-data-mock.js to be used in setup.

    var json = wrmData.claim("jira.core:feature-flags-data.feature-flag-data");
    var featureFlagStates = json && json["feature-flag-states"] || {};
    var systemEnabledFeatures = json && json["enabled-feature-keys"] || [];

    var contains = function contains(arr, target) {
        return arr.indexOf(target) !== -1;
    };

    /**
     * Checks if the given feature is enabled. If no feature flag is defined with
     * the given feature key, this will fall-back to the default feature manager behaviour (like AJS.DarkFeatures.isEnabled(..))
     * @param featureKey a String, usually of the form "my.feature.key" (NOT "my.feature.key.enabled" or "my.feature.key.disabled")
     * @returns {boolean}
     */
    exports.isFeatureEnabled = function (featureKey) {
        if (featureFlagStates.hasOwnProperty(featureKey)) {
            return featureFlagStates[featureKey];
        }
        return contains(systemEnabledFeatures, featureKey);
    };
});
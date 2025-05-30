/**
 * Exposes currently logged-in jira user's timezone preferences.
 *
 * @typedef {Object} UserTimeZonePreferences
 * @property {string} offset the GMT offset in the format (GMT[+|-]hh:mm)
 * @see com.atlassian.jira.timezone.TimeZoneInfo.getGMTOffset
 *
 * @returns {UserTimeZonePreferences} user time zone preferences
 */
define('jira/util/users/time-zone', ['wrm/data'], function (wrmData) {
    "use strict";

    return Object.freeze(wrmData.claim('jira.core:userTimeZoneProvider.data') || {});
});
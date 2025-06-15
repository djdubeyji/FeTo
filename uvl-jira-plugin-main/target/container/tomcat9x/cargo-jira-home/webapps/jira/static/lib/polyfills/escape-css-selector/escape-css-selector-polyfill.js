/**
 * Escape CSS selectors
 *
 * P(r)olyfill for https://drafts.csswg.org/cssom/#the-css.escape()-method
 *
 * Technically - a backport of jQuery 3.0 escapeSelector
 *
 */
define('jira/polyfill/escapeCSSSelector', [], function() {
    return CSS.escape;
});

define('jira/autocomplete/snapshot-autocomplete', ['jira/autocomplete/rest-autocomplete', 'jira/util/browser', 'jira/util/elements', 'jira/util/objects', 'jira/moment', 'jira/util/data/meta', 'jira/moment/moment.jira.formatter', 'wrm/context-path', 'jquery'], function (RESTAutoComplete, Browser, Elements, Objects, moment, meta, momentFmt, wrmContextPath, jQuery) {
    'use strict';

    var contextPath = wrmContextPath();
    var ENDPOINT = contextPath + '/rest/api/2/index-snapshot';
    var MOMENT_FORMAT_TIME = momentFmt.translateSimpleDateFormat(meta.get('date-time'));
    var MOMENT_FORMAT_DATE = momentFmt.translateSimpleDateFormat(meta.get('date-dmy'));

    var SnapshotAutoComplete = function SnapshotAutoComplete(options) {

        /** @lends UserAutoComplete.prototype */
        var that = Objects.begetObject(RESTAutoComplete);

        that.getAjaxParams = function () {
            return {
                data: {},
                url: ENDPOINT,
                dataType: 'json',
                type: 'GET'
            };
        };

        /**
         *
         * @param response {object[]}
         * @param filter {string}
         * @returns {*}
         */
        function getResults(response, filter) {
            if (!filter) {
                return response;
            }
            return response.filter(function (_ref) {
                var absolutePath = _ref.absolutePath;

                return absolutePath.toLowerCase().includes(filter.toLowerCase());
            });
        }

        /**
         * @param timestamp {number}
         * @returns {string}
         */
        function getSnapshotDate(timestamp) {
            return moment(timestamp).format(MOMENT_FORMAT_DATE) + ' ' + moment(timestamp).format(MOMENT_FORMAT_TIME);
        }

        /**
         * @param absolutePath {string}
         * @returns {string}
         */
        function getSnapshotName(absolutePath) {
            return absolutePath.split('/').pop();
        }

        /**
         * Create html elements from JSON object
         * @param {Array} response - JSON object
         * @returns {Array} Multidimensional array, one column being the html element and the other being its
         * corresponding autocomplete value.
         */
        that.renderSuggestions = function (response) {
            if (!Browser.isSelenium() && !Elements.elementIsFocused(this.field)) {
                return false;
            }

            var resultsContainer = void 0;
            var suggestionNodes = [];

            // remove previous results
            this.clearResponseContainer();

            var results = getResults(response || [], that.field.val());
            if (results && results.length > 0) {
                resultsContainer = jQuery('<ul/>').appendTo(this.responseContainer);
                jQuery(results).each(function (index, snapshot) {
                    // add html element and corresponding complete value to suggestionNodes array
                    suggestionNodes.push([jQuery('<li title="' + snapshot.absolutePath + '"/>').html('<span class="aui-lozenge aui-lozenge-subtle">' + getSnapshotDate(snapshot.timestamp) + '</span> ' + getSnapshotName(snapshot.absolutePath)).appendTo(resultsContainer), snapshot.absolutePath]);
                });
            }

            if (suggestionNodes.length > 0) {
                that.addSuggestionControls(suggestionNodes);
            }
            return suggestionNodes;
        };

        that.init(options);

        return that;
    };
    return SnapshotAutoComplete;
});
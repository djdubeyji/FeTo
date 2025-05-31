define('jira/autocomplete/user-autocomplete', ['jira/autocomplete/rest-autocomplete', 'jira/data/parse-options-from-fieldset', 'jira/field/create-user-picker-popup-trigger', 'jira/util/browser', 'jira/util/elements', 'jira/util/objects', 'wrm/context-path', 'jquery'], function (RESTAutoComplete, parseOptionsFromFieldset, userPopup, Browser, Elements, Objects, wrmContextPath, jQuery) {
    'use strict';

    var contextPath = wrmContextPath();
    var ENDPOINT = contextPath + '/rest/api/1.0/users/picker';

    /**
     * User picker - converted from YUI based autocomplete. There is some code in here that probably isn't necessary,
     * if removed though selenium tests would need to be re-written.
     * @class UserAutoComplete
     * @extends RESTAutoComplete
     * @param {Object} options
     */
    var UserAutoComplete = function UserAutoComplete(options) {

        /** @lends UserAutoComplete.prototype */
        var that = Objects.begetObject(RESTAutoComplete);

        that.getAjaxParams = function () {
            return {
                url: ENDPOINT,
                data: {
                    fieldName: options.fieldID,
                    fieldConfigId: options.fieldConfigID,
                    projectId: options.projectId
                },
                dataType: 'json',
                type: 'GET'
            };
        };

        /**
         * Returns true if the field's containing form has the 'submitted' class.
         *
         * @param field The reference to the field whose form to check for the 'submitted' class.
         * @return {Boolean}
         */
        function fieldsFormHasBeenSubmitted(field) {
            var submitting = false;
            var form = field.closest('form');

            if (form.length && form.hasClass('submitting')) {
                submitting = true;
            }

            return submitting;
        }

        /**
         * Create html elements from JSON object
         * @param {Object} response - JSON object
         * @returns {Array} Multidimensional array, one column being the html element and the other being its
         * corresponding complete value.
         */
        that.renderSuggestions = function (response) {
            if (fieldsFormHasBeenSubmitted(this.field) || !Browser.isSelenium() && !Elements.elementIsFocused(this.field)) {
                return false;
            }

            var resultsContainer = void 0;
            var suggestionNodes = [];

            // remove previous results
            this.clearResponseContainer();

            if (response && response.users && response.users.length > 0) {

                resultsContainer = jQuery('<ul/>').appendTo(this.responseContainer);

                jQuery(response.users).each(function () {

                    // add html element and corresponding complete value  to sugestionNodes Array
                    suggestionNodes.push([jQuery('<li/>').html(this.html).appendTo(resultsContainer), this.name]);
                });
            }

            if (response.footer) {
                this.responseContainer.append(jQuery('<div/>').addClass('yui-ac-ft').html(response.footer).css('display', 'block'));
            }

            if (suggestionNodes.length > 0) {
                that.addSuggestionControls(suggestionNodes);
                jQuery('.atlassian-autocomplete div.yad, .atlassian-autocomplete .labels li').textOverflow({
                    autoUpdate: true
                });
            }

            return suggestionNodes;
        };

        // Use autocomplete only once the field has at least 2 characters
        options.minQueryLength = 2;

        // wait 1/4 of after someone starts typing before going to server
        options.queryDelay = 0.25;

        that.init(options);

        return that;
    };

    /**
     * Searches for and initialises User autocomplete controls within a DOM context.
     * autocomplete controls will be searched for. Defaults to entire DOM.
     *
     * UserAutoComplete is used in no-custom field cases mostly; ie. Watchers or Project Roles,
     * where you don't have users displayed as little pills.
     *
     * @param {HTMLElement|String} [parent]
     * @static
     */
    UserAutoComplete.init = function (parent) {
        jQuery('fieldset.user-picker-params', parent).each(function () {
            var params = parseOptionsFromFieldset(jQuery(this));
            var field = params.fieldId || params.fieldName;
            var $field = jQuery(parent).find('#' + field);
            var $popupTrigger = jQuery('#' + field + '_container').find('.popup-trigger');

            initPopupTrigger($popupTrigger, params);
            if (params.userPickerEnabled) {
                initAutoComplete($field, params);
            }
        });
    };

    /**
     * @typedef {Object} AutoCompleteParams
     * @property {string} formName - name attribute of the parent form
     * @property {string} fieldName - field name; used as ID and NAME attributes
     * @property {string} fieldId - id attribute of the field
     * @property {string} fieldConfigId - config id of the field
     * @property {string} projectId - current project id
     * @property {boolean} multiSelect - is it a multi or single select? Used in popup
     * @property {boolean} actionToOpen - action to perform in modal
     * @property {boolean} userPickerEnabled - has BROWSE_USERS permission
     * @property {boolean} useFrotherControl - should use frothered (rich, nice) version
     */

    /**
     * Initialize a button with window allowing for refined search.
     * @param $element {jQuery} - jQuery element to attach popup to
     * @param params {AutoCompleteParams} - options
     */
    function initPopupTrigger($element, params) {
        $element.on('click', userPopup.createUserPickerPopupTrigger({
            urlBase: contextPath,
            formName: params.formName || $element.closest('form').attr('name'),
            fieldName: params.fieldName,
            multiSelect: params.multiSelect,
            fieldConfigId: params.fieldConfigId,
            projectIds: params.projectId,
            actionToOpen: params.actionToOpen
        }));
    }

    /**
     * Initialize AutoComplete with AJAX.
     * Used in Project Roles or Watchers.
     * @param $element {jQuery} - jQuery element to attach AutoComplete to
     * @param params {AutoCompleteParams} - options
     */
    function initAutoComplete($element, params) {
        UserAutoComplete({
            field: parent ? $element : null,
            fieldID: params.fieldName,
            fieldConfigID: params.fieldConfigId,
            projectId: params.projectId,
            delimChar: params.multiSelect === false ? undefined : ",",
            ajaxData: {
                fieldName: params.fieldName
            }
        });
    }

    return UserAutoComplete;
});
/** Preserve legacy namespace
 @deprecated jira.widget.autocomplete.Users */
AJS.namespace('jira.widget.autocomplete.Users', null, require('jira/autocomplete/user-autocomplete'));
AJS.namespace('JIRA.UserAutoComplete', null, require('jira/autocomplete/user-autocomplete'));
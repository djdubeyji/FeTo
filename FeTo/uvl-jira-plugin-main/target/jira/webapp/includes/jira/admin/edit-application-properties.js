require(['jquery', 'jira/backbone-1.3.3', 'jira/util/init-on-dcl'], function (jQuery, Backbone, initOnDCL) {
    "use strict";

    /**
     * @class GravatarSettingsView
     */

    var GravatarSettingsView = Backbone.View.extend({
        events: {
            "click input[name=useGravatar]:checked": "_onUseGravatarClicked"
        },

        /**
         * @constructs
         * @extends Backbone.View
         */
        initialize: function initialize() {
            Backbone.View.prototype.initialize.call(this, arguments);

            this._gravatarServer = this.$el.find('.gravatar-server');
        },

        /**
         * Hides or shows the "gravatar server" input box.
         *
         * @private
         */
        _onUseGravatarClicked: function _onUseGravatarClicked(e) {
            var gravatarOn = this.$(e.target).val() === 'true';

            this._gravatarServer.toggleClass('hidden', !gravatarOn);
        }
    });

    initOnDCL(function () {
        jQuery('#edit-application-properties').each(function () {
            new GravatarSettingsView({ el: this });
        });
    });
});
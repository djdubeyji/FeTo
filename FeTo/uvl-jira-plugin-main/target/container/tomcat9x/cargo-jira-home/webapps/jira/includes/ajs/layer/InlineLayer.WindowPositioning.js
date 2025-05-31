define('jira/ajs/layer/inline-layer/window-positioning', ['jira/ajs/layer/inline-layer/standard-positioning', 'jquery'], function (StandardPositioning, jQuery) {
    'use strict';

    /**
     * An {@link InlineLayer} positioning controller that ensures the layer doesn't overflow the bottom of the window.
     *
     * @class WindowPositioning
     * @extends StandardPositioning
     */

    return StandardPositioning.extend({

        /**
         * @override {@link StandardPositioning.left}
         */
        left: function left() {
            var standardPos = this._super();
            if (this._spaceBottom() >= (this.maxRecordedHeight || this.layer().height())) {
                return standardPos;
            } else if (this._spaceRight() >= this.layer().width()) {
                return this._rightSidePos();
            } else if (this._spaceLeft() >= this.layer().width()) {
                return this._leftSidePos();
            } else {
                return this._rightSidePos();
            }
        },

        /**
         * @override {@link StandardPositioning.right}
         */
        right: function right() {
            var standardPos = this._super();
            if (this._spaceBottom() >= (this.maxRecordedHeight || this.layer().height())) {
                return standardPos;
            } else if (this._spaceLeft() >= this.layer().width()) {
                return this._leftSidePos();
            } else if (this._spaceRight() >= this.layer().width()) {
                return this._rightSidePos();
            } else {
                return this._leftSidePos();
            }
        },

        /**
         * Toggles window positioning behaviour between:
         * - rendering layer just enough to fit into the window (`false`),
         * - rendering layer in inverse direction if it can't fit at the bottom side of the offset target (`true`)
         *
         * This is useful if you don't want offset target to be covered by the layer.
         *
         * @param enabled - boolean changing behaviour of the window positioning
         * @returns {WindowPositioning} - self
         */
        setInversePositioningIfNotFit: function setInversePositioningIfNotFit(enabled) {
            this.shouldInversePositioningDirection = enabled;

            return this;
        },


        /**
         * Calculate space between bottom edge of target and bottom edge of browser window
         *
         * @returns {number} - space under the target
         * @private
         */
        _spaceBottom: function _spaceBottom() {
            var isFixed = this.layer().css("position") === "fixed";
            var windowHeight = jQuery(window).outerHeight();
            var windowScroll = jQuery(window).scrollTop();
            var targetHeight = this.offsetTarget().outerHeight(true);
            return windowHeight - this.offset().top - targetHeight - this._minWindowMargin() + (isFixed ? 0 : windowScroll);
        },

        /**
         * Calculate space between right edge of target and right edge of browser window
         *
         * @returns {number} - space to the right of the target
         * @private
         */
        _spaceRight: function _spaceRight() {
            var isFixed = this.layer().css("position") === "fixed";
            var windowWidth = jQuery(window).outerWidth();
            var windowScroll = jQuery(window).scrollLeft();
            var targetWidth = this.offsetTarget().outerWidth(true);
            return windowWidth - this.offset().left - targetWidth - this._minWindowMargin() + (isFixed ? 0 : windowScroll);
        },

        /**
         * Calculate space between left edge of target and left edge of browser window
         *
         * @returns {number} - space to the left of the target
         * @private
         */
        _spaceLeft: function _spaceLeft() {
            var isFixed = this.layer().css("position") === "fixed";
            var windowScroll = jQuery(window).scrollLeft();
            return this.offset().left - this._minWindowMargin() - (isFixed ? 0 : windowScroll);
        },

        /**
         * Returns space that dropdown layer should be away from window edge
         *
         * @returns {number} - minimum margin between layer and window edge
         * @private
         */
        _minWindowMargin: function _minWindowMargin() {
            // this should return: this.options.cushion();
            // but with JSB-16 I didn't want to change any UX
            return 0;
        },

        /**
         * Calculates Offset object for position to the left of the target (don't mistake with alignment)
         *
         * @returns {{left: number, top: number}} - returned offset
         * @private
         */
        _leftSidePos: function _leftSidePos() {
            return {
                left: this.offset().left - this.layer().outerWidth(true),
                top: this._lowestPos(this.layer())
            };
        },

        /**
         * Calculates Offset object for position to the right of the target (don't mistake with alignment)
         *
         * @returns {{left: number, top: number}} - returned offset
         * @private
         */
        _rightSidePos: function _rightSidePos() {
            return {
                left: this.offset().left + this.offsetTarget().outerWidth(true),
                top: this._lowestPos(this.layer())
            };
        },

        /**
         * Calculate lowest possible vertical coordinate for layer on whe window
         *
         * @param {jQuery} layer
         * @returns {number}
         * @private
         */
        _lowestPos: function _lowestPos(layer) {
            var isFixed = layer.css("position") === "fixed";
            var windowHeight = jQuery(window).outerHeight();
            var windowScroll = jQuery(window).scrollTop();

            // Use different calculation mechanism if inversion of positioning should happen when layer does not fit at the bottom side of the offset target.
            if (this.shouldInversePositioningDirection) {
                var layerHeight = layer.outerHeight(true);

                if (!this.maxRecordedHeight || this.maxRecordedHeight < layerHeight) {
                    this.maxRecordedHeight = layerHeight;
                }

                var offsetTargetRect = this.offsetTarget()[0].getBoundingClientRect();

                return offsetTargetRect.top - layerHeight;
            } else {
                return windowHeight - layer.outerHeight(true) - this._minWindowMargin() + (isFixed ? 0 : windowScroll);
            }
        }
    });
});
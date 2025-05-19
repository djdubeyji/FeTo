define('jira/tipsy', ['jquery'], function ($) {
    $.fn.tipsy = function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        this.tooltip && this.tooltip.apply(this, args);
    };
});

require('jira/tipsy');
require(['jira/util/formatter', 'underscore', 'jira/flag', 'jira/util/init-on-dcl', 'jquery'], function (formatter, _, Flag, initOnDCL, $) {
    'use strict';

    initOnDCL(function () {
        var params = new URL(document.URL).search || '';
        if (params.startsWith("?")) {
            params = params.substr(1);
        }

        var urlSearchParams = new URLSearchParams(params);
        var DELETED_CONTEXT = 'deletedContext';
        var deletedContext = urlSearchParams.get(DELETED_CONTEXT);

        if (deletedContext) {
            Flag.showInfoMsg(null, formatter.I18n.getText("admin.issuefields.config.context.deleted.flag", _.escape(deletedContext), '<strong>', '</strong>'), {
                closeable: true,
                close: 'auto'
            });
            if (window.history.replaceState) {
                urlSearchParams.delete(DELETED_CONTEXT);
                var url = location.pathname + '?' + urlSearchParams.toString();
                window.history.replaceState(null, null, url);
            }
        }

        attachEventsToScreensFormSubmit();
        attachEventsToAUITabs();
        initTooltip();
    });

    function attachEventsToScreensFormSubmit() {
        document.getElementById('screens-form').addEventListener('submit', showSpinnerOnSubmitButton);
    }

    function showSpinnerOnSubmitButton() {
        var screensFormSubmitButton = document.getElementById('screens-form-submit');
        screensFormSubmitButton.busy();
        screensFormSubmitButton.disabled = true;
    }

    function attachEventsToAUITabs() {
        $('.configure-field .menu-item a').each(function () {
            $(this).bind('tabSelect', function (e) {
                if (window.history.replaceState) {
                    var urlSearchParams = new URLSearchParams(new URL(document.URL).search);
                    var selectedTab = e.target.hash.substring(1) === 'screens' ? 'screens' : 'contexts';

                    urlSearchParams.set('selectedTab', selectedTab);

                    var url = location.pathname + '?' + urlSearchParams.toString();

                    window.history.replaceState(null, null, url);
                }
            });
        });
    }

    function initTooltip() {
        $('.context-tooltip').tooltip();
    }
});
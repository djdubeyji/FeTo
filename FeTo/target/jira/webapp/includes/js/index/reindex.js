require(['jquery', 'jira/util/init-on-dcl', 'jira/util/urls'], function ($, initOnDCL, urls) {
    'use strict';

    function resetReindexButton(checkedOption) {
        var reindexButton = $("#start-reindex");
        var tokenPart = "atl_token=" + urls.atl_token();
        var strategyPart = "indexingStrategy=" + checkedOption.attr("value");
        reindexButton.attr("href", checkedOption.attr("boundAction") + "?" + tokenPart + "&" + strategyPart);

        if (checkedOption.attr("continueInDialog") === "true") {
            reindexButton.addClass("trigger-dialog");
        } else {
            reindexButton.removeClass("trigger-dialog");
        }
    }

    initOnDCL(function () {
        var reindexRadios = $('input[type=radio][name=indexingStrategy]');
        reindexRadios.on('change', function () {
            resetReindexButton($(this));
        });
        reindexRadios.attr('changeHandlerBound', '1');

        resetReindexButton($('input[type=radio][checked]'));
    });
});
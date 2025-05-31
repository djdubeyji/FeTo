require(['wrm/require-lazily', 'jira/util/logger'], function (wrmRequireLazily, logger) {
    'use strict';

    wrmRequireLazily('wrc!jira.webresources:mentions-feature').then(function () {
        return require(['jira/mention/mention-element']);
    }).catch(function (error) {
        logger.error(error);
    });
});
define('jira/mention/mention-element', ['jira/mention/mention', 'jira/skate'], function (Mention, skate) {
    'use strict';

    function initMentionsFor(el) {
        var issueKey = el.getAttribute('data-issuekey');
        var useNewEndpoint = el.getAttribute('data-use-new-endpoint') === 'true';

        if (!el._controller) {
            el._controller = new Mention(issueKey, useNewEndpoint);
        }
        el._controller.textarea(el);
    }

    return skate('mentionable', {
        type: skate.type.CLASSNAME,
        created: function created() {},
        attached: function attached(el) {
            if (document.activeElement === el) {
                initMentionsFor(el);
            }
        },
        events: {
            'focus': function focus(el) {
                initMentionsFor(el);
            }
        }
    });
});
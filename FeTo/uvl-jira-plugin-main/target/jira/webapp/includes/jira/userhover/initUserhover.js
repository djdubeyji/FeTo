require(['jquery', 'jira/userhover/userhover', 'jira/util/assistive'], function (jQuery, userhover, Assistive) {
    'use strict';

    jQuery(document).delegate(".user-hover[rel]:not(.user-hover-replaced)", {
        "click": function click() {
            userhover.hide(this, true);
        },
        "mousemove": function mousemove() {
            userhover.show(this);
        },
        "mouseleave": function mouseleave() {
            userhover.hide(this);
        }
    });

    // A new behavior for user-hover popup triggers next to user profile links
    jQuery(document).delegate(".user-hover-trigger", {
        "click keydown": function clickKeydown(e) {
            e.stopPropagation();
            Assistive.handleClickSpaceEnter(e, function () {
                userhover.toggle(this, true);
            }.bind(this));
        }
    });
});
define('jira/viewissue/init-subtask-time-logging', ['jquery'], function ($) {
    'use strict';

    $(document).delegate("#tt_include_subtasks input", "click", function () {
        if ($(this).is(":checked")) {
            $("#tt_info_single").hide();
            $("#tt_info_aggregate").show();
        } else {
            $("#tt_info_aggregate").hide();
            $("#tt_info_single").show();
        }
    });
});
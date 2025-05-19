define("jira/projectpicker/projectpickerutils", [], function () {
  "use strict";

  function showWarningDialog() {
    var form = document.querySelector("[name='jiraform']");
    var dialog = AJS.dialog2("#project-picker-field-warning-dialog");
    var confirmButton = document.querySelector("#project-picker-field-warning-dialog-confirm");
    var cancelButton = document.querySelector("#project-picker-field-warning-dialog-cancel");
    var closeIcon = document.querySelector("#project-picker-field-warning-dialog-close-icon");

    closeIcon.addEventListener("click", function () {
      dialog.hide();
    });
    cancelButton.addEventListener("click", function () {
      dialog.hide();
    });

    cancelButton.addEventListener("keyup", function (event) {
      if (event.code === "Space") {
        dialog.hide();
      }
    });
    confirmButton.addEventListener("click", function () {
      form.submit();
    });

    confirmButton.addEventListener("keyup", function () {
      if (event.code === "Space") {
        form.submit();
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      dialog.show();
    });
  }

  return showWarningDialog;
});

(function (showWarningDialog) {
  "use strict";

  window.addEventListener("load", showWarningDialog);
})(require("jira/projectpicker/projectpickerutils"));
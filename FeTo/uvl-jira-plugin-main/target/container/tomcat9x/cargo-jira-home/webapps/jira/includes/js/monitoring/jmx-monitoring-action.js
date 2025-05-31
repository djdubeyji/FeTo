(function () {
    'use strict';

    require(['wrm/context-path'], function (contextPath) {
        var updateDisplayOfWarningMessages = function updateDisplayOfWarningMessages() {
            document.getElementById('jmx-app-warning-container').hidden = document.getElementById('enable-jmx-toggle').checked || !document.getElementById('enable-app-monitoring-toggle').checked;
            document.getElementById('jmx-ipd-warning-container').hidden = document.getElementById('enable-jmx-toggle').checked || !document.getElementById('enable-ipd-monitoring-toggle').checked;
        };
        var changeJmxState = function changeJmxState(jmxToggle, appToggle, ipdToggle, jmxUrlPrefix, jmxDisableDialog) {
            var jmxStartUrl = jmxUrlPrefix + '/startExposing';
            var jmxStopUrl = jmxUrlPrefix + '/stopExposing';
            var requestedState = jmxToggle.checked;
            var requestUrl = requestedState ? jmxStartUrl : jmxStopUrl;
            fetch(requestUrl, {
                method: 'POST'
            }).then(function (res) {
                if (!res.ok) {
                    jmxToggle.checked = !requestedState;
                    console.error("Error while trying to toggle JMX monitoring", res);
                } else if (requestedState === false) {
                    appToggle.checked = false;
                    ipdToggle.checked = false;
                }
            }).catch(function (err) {
                jmxToggle.checked = !requestedState;
                console.error('Error while trying to toggle jmx monitoring', err);
            }).finally(function () {
                jmxToggle.busy = false;
                if (jmxDisableDialog.isVisible()) {
                    jmxDisableDialog.hide();
                }
                updateDisplayOfWarningMessages();
            });
        };

        var addJmxDisableDialogDisableEventListener = function addJmxDisableDialogDisableEventListener(disableButton, jmxMonitoringToggle, appMonitoringToggle, ipdMonitoringToggle, jmxUrlPrefix, jmxDisableDialog) {
            disableButton.addEventListener('click', function () {
                changeJmxState(jmxMonitoringToggle, appMonitoringToggle, ipdMonitoringToggle, jmxUrlPrefix, jmxDisableDialog);
            });
        };

        var addJmxDisableDialogCancelEventListener = function addJmxDisableDialogCancelEventListener(cancelButton, jmxDisableDialog) {
            cancelButton.addEventListener('click', function () {
                jmxDisableDialog.hide();
            });
        };

        var addJmxDisableDialogEventListeners = function addJmxDisableDialogEventListeners(jmxDisableDialog, jmxMonitorToggle, appMonitoringToggle, ipdMonitoringToggle) {
            jmxDisableDialog.on("hide", function () {
                if (jmxMonitorToggle.busy === true) {
                    jmxMonitorToggle.busy = false;
                    jmxMonitorToggle.checked = !jmxMonitorToggle.checked;
                }
            });
            jmxDisableDialog.on("show", function () {
                var appMonitoringWarning = document.getElementById("disable-jmx-warning-app");
                var ipdMonitoringWarning = document.getElementById("disable-jmx-warning-ipd");
                appMonitoringWarning.hidden = !appMonitoringToggle.checked;
                ipdMonitoringWarning.hidden = !ipdMonitoringToggle.checked;
            });
        };

        var addJmxMonitoringEventListener = function addJmxMonitoringEventListener(jmxMonitoringToggle, appMonitoringToggle, ipdMonitoringToggle, jmxRestPath) {
            var jmxDisableDialog = AJS.dialog2("#disable-jmx-dialog");
            var jmxDisableDialogDisableButton = document.getElementById('jmx-disable-dialog-disable-button');
            var jmxDisableDialogCancelButton = document.getElementById('jmx-disable-dialog-cancel-button');
            addJmxDisableDialogEventListeners(jmxDisableDialog, jmxMonitoringToggle, appMonitoringToggle, ipdMonitoringToggle);
            addJmxDisableDialogDisableEventListener(jmxDisableDialogDisableButton, jmxMonitoringToggle, appMonitoringToggle, ipdMonitoringToggle, jmxRestPath, jmxDisableDialog);
            addJmxDisableDialogCancelEventListener(jmxDisableDialogCancelButton, jmxDisableDialog);

            jmxMonitoringToggle.addEventListener('change', function () {
                jmxMonitoringToggle.busy = true;
                var requestedState = jmxMonitoringToggle.checked;
                if (requestedState === false && (appMonitoringToggle.checked || ipdMonitoringToggle.checked)) {
                    jmxDisableDialog.show();
                } else {
                    changeJmxState(jmxMonitoringToggle, appMonitoringToggle, ipdMonitoringToggle, jmxRestPath, jmxDisableDialog);
                }
            });
        };

        var addJmxEnabledDialogEventListener = function addJmxEnabledDialogEventListener(jmxEnableDialog, monitoringToggle) {
            jmxEnableDialog.on("hide", function () {
                if (monitoringToggle.busy === true) {
                    monitoringToggle.busy = false;
                    monitoringToggle.checked = !monitoringToggle.checked;
                }
            });
        };

        var changeMonitoringState = function changeMonitoringState(monitoringToggle, jmxMonitoringToggle, monitoringRestUrl, jmxEnableDialog) {
            var requestedState = monitoringToggle.checked;
            fetch(monitoringRestUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ enabled: requestedState })
            }).then(function (res) {
                if (!res.ok) {
                    monitoringToggle.checked = !requestedState;
                    console.error("Error while trying to toggle JMX monitoring", res);
                } else if (requestedState === true) {
                    jmxMonitoringToggle.checked = true;
                }
            }).catch(function (err) {
                monitoringToggle.checked = !requestedState;
                console.error('Error while trying to toggle jmx monitoring', err);
            }).finally(function () {
                monitoringToggle.busy = false;
                if (jmxEnableDialog.isVisible()) {
                    jmxEnableDialog.hide();
                }
                updateDisplayOfWarningMessages();
            });
        };

        var addJmxEnableDialogEnableEventListener = function addJmxEnableDialogEnableEventListener(enableButton, monitoringToggle, jmxMonitoringToggle, monitoringRestUrl, jmxEnableDialog) {
            enableButton.addEventListener('click', function () {
                changeMonitoringState(monitoringToggle, jmxMonitoringToggle, monitoringRestUrl, jmxEnableDialog);
            });
        };

        var addJmxEnableDialogCancelEventListener = function addJmxEnableDialogCancelEventListener(cancelButton, jmxEnableDialog) {
            cancelButton.addEventListener("click", function () {
                jmxEnableDialog.hide();
            });
        };

        var addMonitoringEventListener = function addMonitoringEventListener(monitoringToggle, jmxMonitoringToggle, monitoringRestPath, monitoringType) {
            var jmxEnableDialog = AJS.dialog2("#enable-jmx-dialog-for-" + monitoringType);
            var jmxEnableJmxDialogEnableButton = document.getElementById('jmx-enable-dialog-enable-button-for-' + monitoringType);
            var jmxEnableJmxDialogCancelButton = document.getElementById('jmx-enable-dialog-cancel-button-for-' + monitoringType);

            addJmxEnabledDialogEventListener(jmxEnableDialog, monitoringToggle);
            addJmxEnableDialogEnableEventListener(jmxEnableJmxDialogEnableButton, monitoringToggle, jmxMonitoringToggle, monitoringRestPath, jmxEnableDialog);
            addJmxEnableDialogCancelEventListener(jmxEnableJmxDialogCancelButton, jmxEnableDialog);

            monitoringToggle.addEventListener("change", function () {
                var requestedState = monitoringToggle.checked;
                var jmxState = jmxMonitoringToggle.checked;
                monitoringToggle.busy = true;
                if (requestedState === true && jmxState === false) {
                    jmxEnableDialog.show();
                } else {
                    changeMonitoringState(monitoringToggle, jmxMonitoringToggle, monitoringRestPath, jmxEnableDialog);
                }
            });
        };

        var init = function init() {
            var jmxRestPath = contextPath() + '/rest/api/2/monitoring/jmx';
            var appMonitoringRestPath = contextPath() + '/rest/api/2/monitoring/app';
            var ipdMonitoringRestPath = contextPath() + '/rest/api/2/monitoring/ipd';

            var jmxMonitoringToggle = document.getElementById('enable-jmx-toggle');
            var appMonitoringToggle = document.getElementById('enable-app-monitoring-toggle');
            var ipdMonitoringToggle = document.getElementById("enable-ipd-monitoring-toggle");

            addJmxMonitoringEventListener(jmxMonitoringToggle, appMonitoringToggle, ipdMonitoringToggle, jmxRestPath);
            addMonitoringEventListener(appMonitoringToggle, jmxMonitoringToggle, appMonitoringRestPath, "app");
            addMonitoringEventListener(ipdMonitoringToggle, jmxMonitoringToggle, ipdMonitoringRestPath, "ipd");
        };

        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            init();
        } else {
            // eslint-disable-next-line @atlassian/onready-checks/no-domcontentloaded-handlers
            document.addEventListener('DOMContentLoaded', init);
        }
    });
})();
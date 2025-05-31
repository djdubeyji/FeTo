var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/**
 * This script might yield overly pessimistic measurements, depending on how late it is executed.
 * For this reason, the script SHOULD NOT be an `async` script nor be loaded dynamically long after
 * `domContentLoadedEventEnd`.
 */
(function integrateDashboardWithBrowserMetrics() {
    'use strict';

    var metrics = require("internal/browser-metrics");
    var $ = require("jquery");
    var jQueryDeferred = require('jira/jquery/deferred');

    var DASHBOARD_PAGE_KEY = "jira.dashboard";
    var IFRAME_LOAD_TIMEOUT_MS = 10000;
    var LOADED_STATUS = "loaded";
    var TIMEOUT_STATUS = "timeout";
    var IFRAME_GADGET_URL_PATTERN = /\/plugins\/servlet\/gadgets\/ifr\?/;
    // Extract only protocol and host name for safe log
    var URL_SANITIZER_PATTERN = /^(?:[^:]+:)?[./]*[^/:#?]+/;
    var GADGETS = {
        "jira-dashboard-items/assigned-to-me": "gadget.jira.assigned.to.me",
        "jira-dashboard-items/bubble-chart-dashboard-item": "gadget.jira.bubble.chart",
        "jira-dashboard-items/createdvsresolved": "gadget.jira.created.resolved",
        "jira-dashboard-items/favourite-filters": "gadget.jira.favourite.filters",
        "jira-dashboard-items/filter-results": "gadget.jira.filter.results",
        "jira-dashboard-items/in-progress": "gadget.jira.in.progress",
        "jira-dashboard-items/labels": "gadget.jira.labels",
        "jira-dashboard-items/piechart": "gadget.jira.piechart",
        "jira-dashboard-items/sprint-days-remaining": "gadget.jira.sprint.days",
        "jira-dashboard-items/sprint-health": "gadget.jira.sprint.health",
        "jira-dashboard-items/stats": "gadget.jira.stats",
        "jira-dashboard-items/two-dimensional-stats": "gadget.jira.two.dimensional.stats",
        "jira-dashboard-items/voted": "gadget.jira.voted",
        "jira-dashboard-items/watched": "gadget.jira.watched",
        "rest/gadgets/1.0/g/com.atlassian.bonfire.plugin:bonfire-test-sessions-gadget/gadget/bonfire-sessions-gadget.xml": "gadget.rest.bonfire.sessions",
        "rest/gadgets/1.0/g/com.atlassian.jira.ext.calendar:issuescalendar-gadget/templates/plugins/jira/portlets/calendar/gadget/calendar-gadget.xml": "gadget.rest.jiraext.issues.calendar",
        "rest/gadgets/1.0/g/com.atlassian.jira.ext.charting:firstresponse-gadget/com/atlassian/jira/ext/charting/gadget/firstresponse-gadget.xml": "gadget.rest.jiraext.first.response",
        "rest/gadgets/1.0/g/com.atlassian.jira.ext.charting:numberoftimesinstatus-gadget/com/atlassian/jira/ext/charting/gadget/numberoftimesinstatus-gadget.xml": "gadget.rest.jiraext.times.in.status",
        "rest/gadgets/1.0/g/com.atlassian.jira.ext.charting:timeinstatus-gadget/com/atlassian/jira/ext/charting/gadget/timeinstatus-gadget.xml": "gadget.rest.jiraext.issues.calendar.time.in.status",
        "rest/gadgets/1.0/g/com.atlassian.jira.ext.charting:workloadpie-gadget/com/atlassian/jira/ext/charting/gadget/workloadpie-gadget.xml": "gadget.rest.jiraext.workload",
        "rest/gadgets/1.0/g/com.atlassian.jira.gadgets:average-age-chart-gadget/gadgets/average-age-gadget.xml": "gadget.rest.jira.average.age",
        "rest/gadgets/1.0/g/com.atlassian.jira.gadgets:heat-map-gadget/gadgets/heatmap-gadget.xml": "gadget.rest.jira.heat.map",
        "rest/gadgets/1.0/g/com.atlassian.jira.gadgets:project-gadget/gadgets/project-gadget.xml": "gadget.rest.jira.project",
        "rest/gadgets/1.0/g/com.atlassian.jira.gadgets:recently-created-chart-gadget/gadgets/recently-created-gadget.xml": "gadget.rest.jira.recently.created",
        "rest/gadgets/1.0/g/com.atlassian.jira.gadgets:resolution-time-gadget/gadgets/resolution-time-gadget.xml": "gadget.rest.jira.resolution.time",
        "rest/gadgets/1.0/g/com.atlassian.jira.gadgets:road-map-gadget/gadgets/roadmap-gadget.xml": "gadget.rest.jira.roadmap",
        "rest/gadgets/1.0/g/com.atlassian.jira.gadgets:time-since-chart-gadget/gadgets/timesince-gadget.xml": "gadget.rest.jira.timesince",
        "rest/gadgets/1.0/g/com.atlassian.jirafisheyeplugin:crucible-charting-gadget/gadgets/crucible-charting-gadget.xml": "gadget.rest.crucible.charting",
        "rest/gadgets/1.0/g/com.atlassian.jirafisheyeplugin:fisheye-charting-gadget/gadgets/fisheye-charting-gadget.xml": "gadget.rest.fisheye.charting",
        "rest/gadgets/1.0/g/com.atlassian.jirafisheyeplugin:fisheye-recent-commits-gadget/gadgets/fisheye-recent-commits-gadget.xml": "gadget.rest.fisheye.recent",
        "rest/gadgets/1.0/g/com.atlassian.jirawallboard.atlassian-wallboard-plugin:spacer-gadget/gadgets/spacerGadget.xml": "gadget.rest.wallboard.spacer",
        "rest/gadgets/1.0/g/com.atlassian.streams.streams-jira-plugin:activitystream-gadget/gadgets/activitystream-gadget.xml": "gadget.rest.wallboard.spacer",
        "rest/gadgets/1.0/g/com.pyxis.greenhopper.jira:greenhopper-gadget-rapid-view/gadgets/greenhopper-rapid-view.xml": "gadget.rest.greenhopper.rapid.view",
        "rest/gadgets/1.0/g/com.pyxis.greenhopper.jira:greenhopper-gadget-sprint-burndown/gadgets/greenhopper-sprint-burndown.xml": "gadget.rest.greenhopper.sprint.burndown",
        "rest/gadgets/1.0/g/com.pyxis.greenhopper.jira:greenhopper-gadget-version-report/gadgets/greenhopper-version-report.xml": "gadget.rest.greenhopper.version"
    };

    function resolveIframeLoadingPromise(src, gadget, status) {
        (gadget.loadingPromises || []).forEach(function (promise) {
            promise.resolve({
                src: src,
                status: status
            });
        });

        gadget.loadingPromises = [];
    }

    var iframeGadgets = void 0;

    var getIframeGadgets = function getIframeGadgets() {
        if (iframeGadgets) {
            return iframeGadgets;
        }

        var gadgets = {};
        var activeLayoutGadgets = getActiveLayoutGadgets();
        var activeLayoutIframeGadgets = activeLayoutGadgets.filter(function (gadget) {
            return IFRAME_GADGET_URL_PATTERN.test(gadget.renderedGadgetUrl);
        });

        activeLayoutIframeGadgets.forEach(function (gadget) {
            gadgets[removeUrlAnchor(gadget.renderedGadgetUrl)] = {
                key: "jira.gadgets.iframe",
                specId: gadget.gadgetSpecUrl,
                loadingPromises: [],
                renderedMark: null
            };
        });

        iframeGadgets = gadgets;

        return gadgets;
    };

    /**
     * @param {HTMLIFrameElement} iframe
     * @returns a jQuery promise that is resolved when the element has loaded.
     */
    function whenIframeLoaded(iframe) {
        var loading = jQueryDeferred();
        var gadget = getIframeGadgets()[removeUrlAnchor(iframe.src)];

        if (gadget) {
            gadget.loadingPromises.push(loading);
            if (gadget.isOnLoadMarked) {
                resolveIframeLoadingPromise(iframe.src, gadget, LOADED_STATUS);
            }
        } else {
            if (window.document && window.document.readyState === "complete") {
                // iframe was already loaded, so this will make the measurement more pessimistic
                loading.resolve({ src: iframe.src, status: LOADED_STATUS });
            } else {
                var timer = void 0;

                var resolveIframeLoading = function resolveIframeLoading(status) {
                    clearTimeout(timer);
                    $(window).off("load", resolveIframeLoading);
                    loading.resolve({ src: iframe.src, status: status });
                };
                timer = setTimeout(function () {
                    resolveIframeLoading(TIMEOUT_STATUS);
                }, IFRAME_LOAD_TIMEOUT_MS);

                $(window).on("load", function () {
                    resolveIframeLoading(LOADED_STATUS);
                });
            }
        }

        return loading;
    }

    /**
     * @param {HTMLIFrameElement[]} iframes
     * @returns a jQuery promise that is resolved when all iframes matching the selector (at the point in time when the
     * method was called) have loaded. If no elements match the selector, the promise is resolved immediately.
     */
    function whenIframesLoaded(iframes) {
        var loadPromises = iframes.map(function (iframe) {
            return whenIframeLoaded(iframe);
        });

        return $.when.apply($, loadPromises);
    }

    /**
     * @returns a jQuery promise that is resolved when the dashboard has initialized (i.e. all gadgets have been added
     * to the DOM).
     */
    function whenDashboardInitialized() {
        // eslint-disable-next-line new-cap
        var initialized = $.Deferred();

        // Wait for the DOM to be ready so we can inspect the dashboard element.
        $(function inspectDashboard() {
            // eslint-disable-line @atlassian/onready-checks/no-jquery-onready
            var dashboard = $("#dashboard");

            // Harden against this code running _not_ on a dashboard page.
            if (dashboard.length === 0) {
                initialized.reject();
            }

            // The HTML that's delivered to the browser has <div id="dashboard" class="initializing"> and when the
            // dashboard is been initialized the "initializing" class is removed. This can be used in a similar manner
            // to document.readyState to detect if the dashboard is _already_ initialized, or if we need to wait for the
            // "initialized" event.
            if (dashboard.hasClass("initializing")) {
                var resolveDeferred = function resolveDeferred() {
                    dashboard.off("initialized", resolveDeferred);
                    initialized.resolve();
                };

                dashboard.on("initialized", resolveDeferred);
            } else {
                // dashboard was already loaded, but the iframes might not yet be, so the measurement accuracy
                // is unknown at this point
                initialized.resolve();
            }
        });

        return initialized.promise();
    }

    function encodeGadget(name) {
        return GADGETS[name];
    }

    function getActiveLayoutGadgets() {
        var layouts = void 0;
        var dashboard = $("dashboard")[0];

        try {
            layouts = JSON.parse(dashboard.getAttribute('layouts')).layouts;
        } catch (error) {
            return {};
        }

        var activeLayout = layouts.filter(function (layout) {
            return layout.active;
        })[0];

        if (activeLayout && activeLayout.gadgets && activeLayout.gadgets.length) {
            return activeLayout.gadgets;
        }

        return {};
    }

    function removeUrlAnchor(url) {
        return typeof url === 'string' ? url.replace(/#[^#]*$/, '') : url;
    }

    function startMeasurement() {
        var dashboardId = $('meta[name=ajs-dashboard-id]').attr('content');
        metrics.start({
            key: DASHBOARD_PAGE_KEY,
            isInitial: true,
            entityId: dashboardId
        });
    }

    var whenGadgetLoaded = function whenGadgetLoaded(event, args) {
        if (args) {
            var gadget = getIframeGadgets()[removeUrlAnchor(args.gadgetUrl)];

            if (gadget) {
                gadget.isOnLoadMarked = true;

                if (gadget.loadingPromises.length > 0) {
                    resolveIframeLoadingPromise(args.gadgetUrl, gadget, LOADED_STATUS);
                }
            }
        }
    };

    // We want to use a different timeout for onload event as it supposed to be fast and have affect on the
    // overall jira.dashboard metrics
    var timeoutAllIframeLoadingPromise = function timeoutAllIframeLoadingPromise() {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = Object.entries(getIframeGadgets())[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var _ref = _step.value;

                var _ref2 = _slicedToArray(_ref, 2);

                var key = _ref2[0];
                var value = _ref2[1];

                if (value && value.loadingPromises.length > 0) {
                    resolveIframeLoadingPromise(key, value, TIMEOUT_STATUS);
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    };

    $(document).on("gadget-loaded", whenGadgetLoaded);

    var resolveIframeOnloadTimer = void 0;

    whenDashboardInitialized().then(function () {
        // Force clean up onload listener after IFRAME_LOAD_TIMEOUT_MS and resolve all iframe loading promises.
        resolveIframeOnloadTimer = setTimeout(timeoutAllIframeLoadingPromise, IFRAME_LOAD_TIMEOUT_MS);
    });

    /**
     * Sanitize the url to avoid carrying private custom data
     * @param url
     */
    function sanitizeUrlLog(url) {
        if (!url || /^\s+$/.test(url)) {
            return "[empty]";
        }
        var gadget = getIframeGadgets()[removeUrlAnchor(url)];
        if (gadget) {
            return gadget.specId;
        }
        var matches = URL_SANITIZER_PATTERN.exec(url);
        if (matches) {
            return matches[0];
        }
        // in case the url starts with "#", ":" or "?"
        return "[masked]";
    }

    // Wait for the dashboard to be loaded, otherwise gadget iframes may not yet exist in the DOM.
    var dashboardInitializedPromise = whenDashboardInitialized();
    var reporters = [];

    var dashboardInitializedMark = void 0;

    dashboardInitializedPromise.pipe(function () {
        if (performance) {
            dashboardInitializedMark = Math.round(performance.now());
        }
    });
    reporters.push(
    // Report dashboard shell initialized metrics
    function () {
        if (typeof dashboardInitializedMark === 'number') {
            return {
                dashboardInitialized: dashboardInitializedMark
            };
        }
        return {};
    });

    function endMeasurementWithIframeTimeoutReport(frames) {
        metrics.end({
            key: DASHBOARD_PAGE_KEY,
            reporters: reporters.concat(function () {
                var activeLayoutGadgets = getActiveLayoutGadgets();
                var marks = activeLayoutGadgets.map(function (gadget) {
                    return encodeGadget(gadget.amdModule || gadget.gadgetSpecUrl) || 'gadget.unknown';
                }).reduce(function (obj, value) {
                    if (obj.hasOwnProperty(value)) {
                        obj[value] += 1;
                    } else {
                        obj[value] = 1;
                    }

                    return obj;
                }, {});

                return marks;
            })
        });

        resolveIframeOnloadTimer && clearTimeout(resolveIframeOnloadTimer);
        $(document).off("gadget-loaded", whenGadgetLoaded);

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = Object.entries(frames)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var _ref3 = _step2.value;

                var _ref4 = _slicedToArray(_ref3, 2);

                var value = _ref4[1];

                if (value.status === TIMEOUT_STATUS) {
                    console.log("dashboard.metrics", "iframe onload timed out: " + sanitizeUrlLog(value.src));
                }
            }
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
        }
    }

    dashboardInitializedPromise.pipe(function () {
        startMeasurement();
        //MNSTR-6303: Iframe gadgets are lazy loaded. Those that contain src=about:blank are outside the viewport and do not fetch data until scroll.
        //That is why we do not want to wait with measurement for them.
        var iframes = $("#dashboard").find(".dashboard-item-content").find("iframe[src!='about:blank']").get();
        return whenIframesLoaded(iframes);
    }).done(function () {
        endMeasurementWithIframeTimeoutReport(arguments);
    });
})();
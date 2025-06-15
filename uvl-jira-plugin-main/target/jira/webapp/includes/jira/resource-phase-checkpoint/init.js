window.__resourcePhaseCheckpointResolvers = {
    resolveDeferPhaseCheckpoint: null,
    resolveInteractionPhaseCheckpoint: null
};

/**
 * Attaches click/keydown listeners to be later consumed in deferred scripts reporter.
 * See MNSTR-6146 for details.
 */
{
    if (window.performance && window.performance.mark) {
        if (!window.DeferScripts) {
            window.DeferScripts = {};
        }
        window.DeferScripts.totalClicks = 0;
        window.DeferScripts.totalKeydowns = 0;
        window.DeferScripts.clickListener = function () {
            "use strict";

            window.DeferScripts.totalClicks += 1;
        };
        window.addEventListener("click", window.DeferScripts.clickListener);
        window.DeferScripts.keydownListener = function () {
            "use strict";

            window.DeferScripts.totalKeydowns += 1;
        };
        window.addEventListener("keydown", window.DeferScripts.keydownListener);
    }
}

window.resourcePhaseCheckpoint = Object.freeze({
    // This promise will be resolved when resources required with WRM's DEFER phase get executed
    defer: new Promise(function (resolve) {
        "use strict";

        window.__resourcePhaseCheckpointResolvers.resolveDeferPhaseCheckpoint = resolve;
    }),
    // This promise will be resolved sometime during the WRM's INTERACTION phase
    interaction: new Promise(function (resolve) {
        "use strict";

        window.__resourcePhaseCheckpointResolvers.resolveInteractionPhaseCheckpoint = resolve;
    })
});
Object.freeze(window.__resourcePhaseCheckpointResolvers);
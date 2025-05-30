window.__resourcePhaseCheckpointResolvers.resolveDeferPhaseCheckpoint();
// eslint-disable-next-line
document.addEventListener('DOMContentLoaded', function () {
    "use strict";

    setTimeout(function () {
        window.__resourcePhaseCheckpointResolvers.resolveInteractionPhaseCheckpoint();
        /**
         * Removes click/keydown listeners related to deferred scripts reporter.
         * See MNSTR-6146 for details.
         */
        {
            if (window.performance && window.performance.mark) {
                window.performance.mark('defer_scripts_clicks', { detail: { count: window.DeferScripts.totalClicks } });
                window.performance.mark('defer_scripts_keydowns', { detail: { count: window.DeferScripts.totalKeydowns } });

                // listeners are defined in "resource-phase-checkpoint/init.js" file
                if (window.DeferScripts.clickListener && window.DeferScripts.keydownListener()) {
                    window.removeEventListener("click", window.DeferScripts.clickListener);
                    window.removeEventListener("keydown", window.DeferScripts.keydownListener);
                }
            }
        }
    });
});
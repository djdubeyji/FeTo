/**
 * Creates a terminology onboarding inline dialog
 */
define('jira/terminology-onboarding-dialog', ['jira/terminology-onboarding-state', 'jquery', 'underscore'], function (terminologyOnboardingState, $, _) {
    'use strict';

    return {
        /**
         * Creates a terminology onboarding AUI inline dialog
         * @param {jQuery} $container - A container element where the dialog should be injected
         * @param {jQuery} $trigger - Trigger element for the dialog (dialog opens when this element is clicked)
         * @param {Object} newNamePlural - Terminology Entry object
         * @param {String} fieldType - ['sprint' | 'epic']
         */
        addInlineDialogToField: function addInlineDialogToField($container, $trigger, _ref, fieldType) {
            var newNamePlural = _ref.newNamePlural;

            if (!$trigger.length) {
                // current issue might not have this field
                return;
            }
            var templateData = {
                fieldType: fieldType,
                newNamePlural: _.escape(newNamePlural)
            };
            var $infoIcon = $(JIRA.Templates.Terminology.onboardingInfoIcon(templateData));
            var $onboardingMessage = $(JIRA.Templates.Terminology.onboardingDilaog(templateData));
            // Direct handler since there will only ever be 2 of them.
            $onboardingMessage.find('.terminology-dismiss-btn').on('click', function () {
                terminologyOnboardingState.set(fieldType);
                $infoIcon.remove();
                $onboardingMessage.remove();
            });
            $trigger.append($infoIcon);
            $container.append($onboardingMessage);
        }
    };
});
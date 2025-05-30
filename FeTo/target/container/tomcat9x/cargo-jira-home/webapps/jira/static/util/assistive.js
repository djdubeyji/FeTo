define('jira/util/assistive', ['jira/util/navigator'], function (Navigator) {
    'use strict';

    /**
     * When things become visible it takes a while for the browsers to expose
     * that information to the screen readers (or for the screen readers to recognise it).
     * The duration below is the shortest timeout that worked with AWS + NVDA + VoiceOver.
     */

    var ASSISTIVE_TIMEOUT = 50;

    /**
     * This is a workaround to fix JRA-45778 as suggested here:
     * http://connect.microsoft.com/IE/feedbackdetail/view/851144/assigning-textcontent-crashes-the-browser-tab
     * Basically for IE we are using the "innerText" property instead of "textContent" to set text on the element.
     */
    var textProperty = Navigator.isIE() ? "innerText" : "textContent";

    /**
     * Special hidden div. Its contents will be read by a screen reader.
     */
    var assistiveEl = void 0;

    var assistiveId = 0;

    /**
     * When things become visible it takes a while for the browsers to expose
     * that information to the screen readers (or for the screen readers to recognise it).
     * Using this function will make sure it happens at the right time.
     *
     * @param callback to be executed after the timeout
     */
    function wait(callback) {
        setTimeout(callback, ASSISTIVE_TIMEOUT);
    }

    /**
     * Sometimes it is needed to read some assistive text to the user through screen reader
     * even though it doesn't make much sense to give focus to the element that contains it.
     * E.g. "no results" message on a combobox.
     *
     * @param toRead text to be read by the screen reader
     */
    function readText(toRead) {
        if (!assistiveEl) {
            assistiveEl = document.createElement("div");
            assistiveEl.setAttribute("id", "assistive-text");
            assistiveEl.setAttribute("class", "visually-hidden");
            assistiveEl.setAttribute("aria-hidden", "false");
            assistiveEl.setAttribute("role", "status");
            assistiveEl.setAttribute("aria-live", "assertive");
            assistiveEl.setAttribute("aria-relevant", "additions");

            document.body.appendChild(assistiveEl);
        }

        // This needs to be an empty space because Chrome has/d an issue where it would only announce content to screen readers
        // when it changes from something, to something else. It doesn't announce if going from null to something.
        assistiveEl[textProperty] = " ";
        wait(function () {
            assistiveEl[textProperty] = toRead;
        });
    }

    /**
     * Creates an element that can later be used as "aria-describedby" on other
     * element to provide extra description for people with disabilities.
     *
     * If only text is passed, new element with random id will be created.
     * If id is passed, depending on the need, new element will be created
     * or the existing one will get updated with the new text.
     *
     * @param text the label should contain
     * @param id optional id of the element
     *
     * @returns id of the existing or created element
     */
    function createOrUpdateLabel(text, id) {
        if (!id) {
            id = 'label-' + assistiveId;
            assistiveId += 1;
        }
        var element = document.getElementById(id);
        if (!element) {
            element = document.createElement("div");
            element.setAttribute("id", id);
            element.setAttribute("class", "visually-hidden");
            element.setAttribute("aria-hidden", "false");
            document.body.appendChild(element);
        }
        element[textProperty] = text;
        return id;
    }

    /**
     * If Space or Enter key was pressed, call the callback (if provided) or click the event.target
     *
     * @param {jQuery.Event|KeyboardEvent} event a keyboard event
     * @param cb optional callback. If omitted, make sure that the event.target has the click() method
     *           (https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/click)
     */
    function handleSpaceEnter(event, cb) {
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            if (typeof cb === 'function') {
                cb(event);
            } else {
                event.target.click();
            }
        }
    }

    /**
     * If there was either a mouse click, or Space/Enter key was pressed,
     * call the callback provided.
     *
     * @param {jQuery.Event|Event|KeyboardEvent} event an event
     * @param cb callback to fire
     */
    function handleClickSpaceEnter(event, cb) {
        if (event.type === 'click') {
            cb(event);
        } else {
            handleSpaceEnter(event, cb);
        }
    }

    /**
     * Helps configure roving tabindex for a set of provided items.
     * Especially useful for toolbars.
     *
     * @param {HTMLElement} container a container with focusable items to attach events to
     * @param {string} itemsSelector optional selector for focusable items to be used instead of the default one
     * @returns a cleanup function for restoring the initial state
     */
    function configureRovingTabindex(container, itemsSelector) {
        container.setAttribute('tabindex', 0);
        var focusableNeedle = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
        if (itemsSelector) {
            focusableNeedle = itemsSelector;
        }
        var focusableItems = container.querySelectorAll(focusableNeedle);
        focusableItems.forEach(function (i) {
            return i.setAttribute('tabindex', -1);
        });
        var currentItemIdx = 0;

        function handleKeydown(event) {
            // Assuming the number of focusable items isn't changed while navigating
            // between them
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
                return;
            }
            event.preventDefault();
            event.stopPropagation();

            focusableItems[currentItemIdx].setAttribute('tabindex', -1);
            var nextItemIdx = void 0;
            if (event.key === 'ArrowLeft') {
                nextItemIdx = currentItemIdx === 0 ? focusableItems.length - 1 : currentItemIdx - 1;
            } else {
                nextItemIdx = currentItemIdx === focusableItems.length - 1 ? 0 : currentItemIdx + 1;
            }
            focusableItems[nextItemIdx].focus();
            currentItemIdx = nextItemIdx;
        }

        function handleFocus() {
            // Every time focus gets to the container, we need to run
            // the query again to catch new possible items
            focusableItems = container.querySelectorAll(focusableNeedle);
            if (!focusableItems.length) {
                return;
            }

            focusableItems.forEach(function (i) {
                return i.setAttribute('tabindex', -1);
            });

            if (currentItemIdx >= focusableItems.length) {
                currentItemIdx = focusableItems.length - 1;
            }

            focusableItems[currentItemIdx].focus();
        }

        function handleFocusIn(event) {
            // Required for dropdown menus to work correctly
            container.setAttribute('tabindex', -1);
            event.target.setAttribute('tabindex', 0);
        }

        function handleFocusOut(event) {
            if (!event.relatedTarget || Array.from(focusableItems).includes(event.relatedTarget)) {
                return;
            }

            focusableItems[currentItemIdx].setAttribute('tabindex', -1);
            container.setAttribute('tabindex', 0);
        }

        container.addEventListener('keydown', handleKeydown);
        container.addEventListener('focus', handleFocus);
        container.addEventListener('focusin', handleFocusIn);
        container.addEventListener('focusout', handleFocusOut);

        function cleanup() {
            container.removeAttribute('tabindex');
            focusableItems.forEach(function (i) {
                return i.setAttribute('tabindex', 0);
            });
            container.removeEventListener('keydown', handleKeydown);
            container.removeEventListener('focus', handleFocus);
            container.removeEventListener('focusin', handleFocusIn);
            container.removeEventListener('focusout', handleFocusOut);
        }

        return cleanup;
    }

    return {
        wait: wait,
        readText: readText,
        createOrUpdateLabel: createOrUpdateLabel,
        handleSpaceEnter: handleSpaceEnter,
        handleClickSpaceEnter: handleClickSpaceEnter,
        configureRovingTabindex: configureRovingTabindex
    };
});
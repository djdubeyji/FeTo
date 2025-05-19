AJS.test.require(['jira.webresources:empty-states', 'jira.webresources:wrm-context-path'], function () {
    'use strict';

    require(['jira/empty-states/template', 'wrm/context-path'], function (template, contextPath) {
        var CONTAINER_SELECTOR = '.empty-state__container';
        var IMAGE_SELECTOR = CONTAINER_SELECTOR + ' .empty-state__spot';
        var MESSAGE_SELECTOR = CONTAINER_SELECTOR + ' .empty-state__message';
        var HINT_SELECTOR = CONTAINER_SELECTOR + ' .empty-state__hint';

        function assertImage(fixture, expectedImageURL) {
            var img = fixture.querySelector(IMAGE_SELECTOR);
            ok(img, 'Could not find `.empty-state__spot` element');

            equal(img.getAttribute('src'), expectedImageURL, 'Expected different image src attribute');
        }

        module('Jira EmptyStates', {
            setup: function setup() {
                this.fixture = document.getElementById('qunit-fixture');
            },
            teardown: function teardown() {
                this.fixture.innerHTML = '';
            }
        });

        test('Should use a default image when $imageURL not provided', function () {
            this.fixture.innerHTML = template.render({ message: '' });

            assertImage(this.fixture, contextPath() + '/images/empty-states/no-results.svg');
        });

        test('Should use provided $imageURL', function () {
            var imageURL = '/some/path/to/image.svg';
            this.fixture.innerHTML = template.render({ message: '', imageURL: imageURL });

            assertImage(this.fixture, imageURL);
        });

        ['some-css-class', 'class1 class2', 'class3 class2 class1', undefined, ''].forEach(function (extraClasses) {
            test('Should render the empty state container with correct css classes for $extraClasses=' + extraClasses, function () {
                this.fixture.innerHTML = template.render({ message: '', extraClasses: extraClasses });

                var container = this.fixture.querySelector(CONTAINER_SELECTOR);
                var actualExtraClasses = Array.from(container.classList.values()).sort();

                var expectedExtraClasses = extraClasses && extraClasses.trim() ? extraClasses.trim().split(' ') : [];
                expectedExtraClasses.push('empty-state__container');
                expectedExtraClasses.sort();

                deepEqual(actualExtraClasses, expectedExtraClasses, 'Expected different css classes');
            });
        });

        ['No issues were found to match your search', '<strong>markup should be escaped here</strong>', ''].forEach(function (message) {
            test('Should render the empty state message for $message=' + message, function () {
                this.fixture.innerHTML = template.render({ message: message });

                var messageEl = this.fixture.querySelector(MESSAGE_SELECTOR);
                ok(messageEl, 'Could not find `.empty-state__message` element');

                equal(messageEl.textContent, message, 'Expected different empty state message');
                equal(this.fixture.querySelector(HINT_SELECTOR), null, 'Hint element should not be rendered');
            });
        });

        var hints = ['Try logging in to see more results', 'Try <a href="#">logging in</a> to see more results'];

        hints.forEach(function (hint) {
            test('Should render the empty state hint for $hint=' + hint + ' with not provided \'noAutoescapeHint\'', function () {
                this.fixture.innerHTML = template.render({ message: '', hint: hint });

                var hintEl = this.fixture.querySelector(HINT_SELECTOR);
                ok(hintEl, 'Could not find `.empty-state__hint` element');

                equal(hintEl.textContent, hint, 'Expected different empty state hint');
            });
        });

        hints.forEach(function (hint) {
            test('Should render the empty state hint for $hint=' + hint + ' with $noAutoescapeHint=true', function () {
                this.fixture.innerHTML = template.render({ message: '', hint: hint, noAutoescapeHint: true });

                var hintEl = this.fixture.querySelector(HINT_SELECTOR);
                ok(hintEl, 'Could not find `.empty-state__hint` element');

                equal(hintEl.innerHTML, hint, 'Expected different empty state hint');
            });
        });
    });
});
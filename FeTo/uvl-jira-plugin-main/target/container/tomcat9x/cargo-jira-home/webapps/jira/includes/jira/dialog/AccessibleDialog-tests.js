AJS.test.require(['jira.webresources:jira-accessible-dialog'], function () {
    'use strict';

    var $ = require('jquery');
    var AccessibleDialog = require('jira/dialog/accessible-dialog');

    module('AccessibleDialog attributes', {
        setup: function setup() {
            this.dialog = new AccessibleDialog({ id: 'accessible-dialog' });
        },
        teardown: function teardown() {
            this.dialog.remove();
        }
    });

    test('AccessibleDialog has all the required attributes set', function () {
        var title = 'Dialog Title';
        this.dialog.addHeader(title);
        this.dialog.show();

        var $dialog = $('#accessible-dialog');
        var className = AccessibleDialog.ClassNames.Dialog;
        ok($dialog.hasClass(className), 'Dialog has the ' + className + ' class.');
        equal($dialog.attr('aria-hidden'), 'false', 'Dialog has aria-hidden set to "false".');
        equal($dialog.attr('role'), 'dialog', 'Dialog has role set to "dialog".');
        equal($dialog.attr('aria-modal'), 'true', 'Dialog has aria-modal set to "true".');
    });

    module('AccessibleDialog header', {
        setup: function setup() {
            this.dialog = new AccessibleDialog({ id: 'accessible-dialog' });
        },
        teardown: function teardown() {
            this.dialog.remove();
        }
    });

    test('Title is placed inside the .dialog-header element and is contained within an h1', function () {
        var title = 'Dialog Title';
        this.dialog.addHeader(title);
        var $heading = this.dialog.popup.element.find('.dialog-header');
        var $title = $heading.children(':first');
        ok($title.is('.dialog-title'), 'Dialog\'s title is the first child of the dialog\' header.');
        ok($title.is('h1'), 'Dialog\'s title is contained within an h1 element.');
        equal($title.text(), title);
    });

    function setupDialogPage(dialog, $content) {
        var curpage = dialog.curpage;
        dialog.addHeader('Page' + curpage + ' title');
        if ($content) {
            dialog.addPanel('Panel' + curpage, $content);
        } else {
            dialog.addPanel('Panel' + curpage, '<p>Test content ' + curpage + '</p>');
        }
        dialog.addButton('Next', function () {
            dialog.nextPage();
        });
        dialog.addCancel("Cancel", function () {
            dialog.remove();
        });
    }

    module('AccessibleDialog labelling', {
        setup: function setup() {
            var dialog = new AccessibleDialog({ id: 'accessible-dialog' });
            setupDialogPage(dialog); // page 0
            this.dialog = dialog;
            this.dialog.show();
        },
        teardown: function teardown() {
            this.dialog.remove();
        }
    });

    test('Dialog is initially labelled by its title element', function () {
        var $dialog = this.dialog.popup.element;
        var $title = $dialog.find('.dialog-title');
        equal($dialog.attr('aria-labelledby'), $title.attr('id'));
    });

    test('Dialog keeps being labelled by the current page\'s title when navigating between pages', function () {
        this.dialog.addPage("page1");
        setupDialogPage(this.dialog); // page 1

        var $dialog = this.dialog.popup.element;
        var $title = $dialog.find('.dialog-title:visible');

        equal($dialog.attr('aria-labelledby'), $title.attr('id'), 'Dialog is labelled by the 2nd page\'s title after adding a new page.');

        this.dialog.addPage("page2");
        setupDialogPage(this.dialog); // page2

        this.dialog.prevPage(); // page 1
        $title = $dialog.find('.dialog-title:visible');
        equal($dialog.attr('aria-labelledby'), $title.attr('id'), 'Dialog is labelled by the 2nd page\'s title after using prevPage.');

        this.dialog.nextPage(); // page 2
        $title = $dialog.find('.dialog-title:visible');
        equal($dialog.attr('aria-labelledby'), $title.attr('id'), 'Dialog is labelled by the 3rd page\'s title after using nextPage.');

        this.dialog.gotoPage(0); // page 0
        $title = $dialog.find('.dialog-title:visible');
        equal($dialog.attr('aria-labelledby'), $title.attr('id'), 'Dialog is labelled by the 1st page\'s title after using gotoPage(0).');
    });

    module('AccessibleDialog default focus management', {
        setup: function setup() {
            var dialog = new AccessibleDialog({ id: 'accessible-dialog' });
            setupDialogPage(dialog); // page 0
            dialog.addPage("page1");
            setupDialogPage(dialog); // page 1
            dialog.addPage("page2");
            setupDialogPage(dialog); // page 2
            dialog.gotoPage(0);
            this.dialog = dialog;

            this.sandbox = sinon.sandbox.create({
                useFakeTimers: true
            });
        },
        teardown: function teardown() {
            this.dialog.remove();
        }
    });

    test('When showing a dialog, the focus jumps to the dialog title, if no options provided', function () {
        var $dialog = this.dialog.popup.element;
        this.dialog.show();
        var $title = $dialog.find('.dialog-title:visible')[0];
        this.sandbox.clock.tick(200);

        equal(document.activeElement, $title);
    });

    test('When moving between pages, the focus jumps to the current page\'s title, if no options provided', function () {
        this.dialog.show();
        this.dialog.nextPage();
        this.sandbox.clock.tick(200);

        var $dialog = this.dialog.popup.element;
        var $title = $dialog.find('.dialog-title:visible')[0];
        equal(document.activeElement, $title, 'The focus moves to the page\'s title after using nextPage.');

        this.dialog.prevPage();
        this.sandbox.clock.tick(200);
        $title = $dialog.find('.dialog-title:visible')[0];
        equal(document.activeElement, $title, 'The focus moves to the page\'s title after using prevPage.');

        this.dialog.gotoPage(2);
        this.sandbox.clock.tick(200);
        $title = $dialog.find('.dialog-title:visible')[0];
        equal(document.activeElement, $title, 'The focus moves to the page\'s title after using gotoPage.');
    });

    module('AccessibleDialog custom focus management', {
        setup: function setup() {
            var $interactiveElement = $('<button id="first-interactive-element">Interactive element</button>');
            var $triggerButton = $('<button id="accessible-dialog-trigger">Open dialog</button>');
            $("#qunit-fixture").append($triggerButton);
            var dialog = new AccessibleDialog({
                id: 'accessible-dialog',
                onPageLoadFocusBehavior: AccessibleDialog.OnPageLoadFocusBehavior.Title,
                $elementToFocusOnClose: $triggerButton
            });
            setupDialogPage(dialog); // page 0, default focus management
            dialog.addPage("page1", AccessibleDialog.OnPageLoadFocusBehavior.FirstInteractiveElement);
            setupDialogPage(dialog, $interactiveElement); // page 1, focusing the first interactive element
            dialog.addPage("page2", function (dialog) {
                dialog.getCurrentPage().element.find(".button-panel-cancel-link").focus();
            });
            setupDialogPage(dialog); // page 2, custom focus management
            dialog.addPage("page3");
            setupDialogPage(dialog); // page 3, just a filler page
            dialog.gotoPage(0);
            this.dialog = dialog;
            this.$interactiveElement = $interactiveElement;
            this.$triggerButton = $triggerButton;

            this.sandbox = sinon.sandbox.create({
                useFakeTimers: true
            });
        },
        teardown: function teardown() {
            if (this.dialog.popup.element) {
                this.dialog.remove();
            }
        }
    });

    test('When showing a dialog, the focus jumps to the dialog title, as provided in the options', function () {
        var $dialog = this.dialog.popup.element;
        this.dialog.show();
        var $title = $dialog.find('.dialog-title:visible')[0];
        this.sandbox.clock.tick(200);

        equal(document.activeElement, $title);
    });

    test('When navigating to the second page, the focus jumps to the first interactive element, as stated in the options', function () {
        this.dialog.show();
        this.dialog.nextPage();
        this.sandbox.clock.tick(200);

        var $interactiveElement = this.$interactiveElement[0];
        equal(document.activeElement, $interactiveElement, 'The focus moves to the first interactive element after using nextPage.');

        this.dialog.nextPage();
        this.dialog.prevPage();
        this.sandbox.clock.tick(200);
        equal(document.activeElement, $interactiveElement, 'The focus moves to the first interactive element after using prevPage.');

        this.dialog.nextPage();
        this.dialog.gotoPage(1);
        this.sandbox.clock.tick(200);
        equal(document.activeElement, $interactiveElement, 'The focus moves to the first interactive element after using gotoPage.');
    });

    test('When navigating to the third page, the focus jumps to the custom element, as stated in the options', function () {
        this.dialog.show();
        this.dialog.nextPage();
        this.dialog.nextPage();
        this.sandbox.clock.tick(200);

        var $currentPage = this.dialog.page[this.dialog.curpage].element;
        var $customElement = $currentPage.find(".button-panel-cancel-link")[0];
        equal(document.activeElement, $customElement, 'The focus moves to the custom element after using nextPage.');

        this.dialog.nextPage();
        this.dialog.prevPage();
        this.sandbox.clock.tick(200);
        equal(document.activeElement, $customElement, 'The focus moves to the the custom element after using prevPage.');

        this.dialog.nextPage();
        this.dialog.gotoPage(2);
        this.sandbox.clock.tick(200);
        equal(document.activeElement, $customElement, 'The focus moves to the custom element after using gotoPage.');
    });

    test('After hiding the dialog, the focus jumps to the provided element', function () {
        this.dialog.show();
        this.sandbox.clock.tick(200);
        this.dialog.hide();
        this.sandbox.clock.tick(200);

        equal(document.activeElement, this.$triggerButton[0]);
    });

    test('After removing the dialog, the focus jumps to the provided element', function () {
        this.dialog.show();
        this.sandbox.clock.tick(200);
        this.dialog.remove();
        this.sandbox.clock.tick(200);

        equal(document.activeElement, this.$triggerButton[0]);
    });
});
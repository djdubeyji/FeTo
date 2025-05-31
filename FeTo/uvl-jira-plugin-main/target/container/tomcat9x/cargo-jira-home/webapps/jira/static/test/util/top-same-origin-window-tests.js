AJS.test.require("jira.webresources:top-same-origin-window", function () {
    'use strict';

    module('jira/util/top-same-origin-window', {
        setup: function setup() {
            this.topSameOriginWindow = require('jira/util/top-same-origin-window');
        }
    });

    test("When first parent is valid", function () {
        var parentNoException = { location: { href: "helloworld" }, AJS: {} };
        var thisWindow = { parent: parentNoException };
        var parentWindow = this.topSameOriginWindow(thisWindow);
        equal(parentWindow, parentNoException);
    });

    test("Window is top window itself (do not need to be Jira window)", function () {
        var thisWindow = {
            // eslint-disable-next-line no-use-before-define
            parent: thisWindow,
            location: {
                href: "helloworld"
            }
        };
        var parentWindow = this.topSameOriginWindow(thisWindow);
        equal(parentWindow, thisWindow);
    });

    test("When first parent is out of scope, returns itself", function () {
        var parentWithException = { location: null };
        var thisWindow = { parent: parentWithException };
        var parentWindow = this.topSameOriginWindow(thisWindow);
        equal(parentWindow, thisWindow);
    });

    test("When second parent is out of scope, returns parent", function () {
        var parentWithException = { location: null };
        var parentNoException = {
            location: {
                href: "helloworld"
            },
            parent: parentWithException,
            AJS: {}
        };
        var thisWindow = { parent: parentNoException };
        this.topSameOriginWindow = require('jira/util/top-same-origin-window');
        var parentWindow = this.topSameOriginWindow(thisWindow);
        equal(parentWindow, parentNoException);
    });

    test("When in same origin goes to the top Jira window", function () {
        var topWindow = {
            location: {
                href: "hello"
            },
            // eslint-disable-next-line no-use-before-define
            parent: topWindow,
            AJS: {}
        };
        var parentNoException = {
            location: {
                href: "hello.world"
            },
            parent: topWindow
        };
        var thisWindow = { parent: parentNoException };
        this.topSameOriginWindow = require('jira/util/top-same-origin-window');
        var parentWindow = this.topSameOriginWindow(thisWindow);
        equal(parentWindow, topWindow);
    });

    test("When in same origin goes to the outer most Jira window that is not the top window", function () {
        var topWindow = {};
        Object.assign(topWindow, {
            location: {
                href: "hello"
            },
            // eslint-disable-next-line no-use-before-define
            parent: topWindow
            // cypress or other host site embedding the product (no AJS)
        });
        var parentNoException = {
            location: {
                href: "hello.jira"
            },
            parent: topWindow,
            AJS: {}
        };
        var thisWindow = { parent: parentNoException };

        this.topSameOriginWindow = require('jira/util/top-same-origin-window');
        var parentWindow = this.topSameOriginWindow(thisWindow);

        equal(parentWindow, parentNoException);
    });

    test("When external dashboard embeds one product whose gadget embeds another product", function () {
        var topWindow = {};
        Object.assign(topWindow, {
            location: {
                href: "external.site"
            },
            // eslint-disable-next-line no-use-before-define
            parent: topWindow
            // cypress or other host site embedding the product (no AJS)
        });
        var oneProduct = {
            location: {
                href: "hello.jira"
            },
            parent: topWindow,
            AJS: {}
        };
        var gadget = {
            location: {
                href: "gadget"
            },
            parent: oneProduct
        };
        var anotherProduct = {
            location: {
                href: "hello.jira2"
            },
            parent: gadget,
            AJS: {}
        };

        this.topSameOriginWindow = require('jira/util/top-same-origin-window');
        var parentWindow = this.topSameOriginWindow(anotherProduct);

        equal(parentWindow, oneProduct);
    });
});
function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

AJS.test.require(["jira.webresources:jquery-plugin-shortener"], function () {
    'use strict';

    var Shortener = require('jira/ajs/shorten/shortener');
    var element = void 0;

    module("Shortener", {
        setup: function setup() {
            element = createMarkup();
            document.querySelector('#qunit-fixture').appendChild(element);
            document.querySelector('#qunit-fixture').style.top = 'auto';
            document.querySelector('#qunit-fixture').style.left = 'auto';
        },
        teardown: function teardown() {
            element.remove();
        }
    });

    test('should render only one expand button when called multiple times', function () {
        var options = {
            element: element
        };

        new Shortener(options);

        equal(getAllExpanders().length, 1, 'short expand');
        equal(getAllBreakLines().length, 1, 'br');

        new Shortener({
            element: getExpander()
        });

        equal(getAllExpanders().length, 1, 'short expand');
        equal(getAllBreakLines().length, 1, 'br');
    });

    test('should show proper count of hidden items when called multiple times', function () {
        var options = {
            element: element
        };

        new Shortener(options);

        equal(document.querySelector('.shortener-expand').textContent, '(9)', 'short expand');

        new Shortener({
            element: getExpander()
        });

        equal(document.querySelector('.shortener-expand').textContent, '(9)', 'short expand');
    });

    function getAllBreakLines() {
        return document.querySelectorAll('br');
    }

    function getAllExpanders() {
        return document.querySelectorAll('.shortener-expand');
    }

    function getExpander() {
        return document.querySelector('.shortener-expand');
    }

    function createMarkup() {
        var wrapper = document.createElement('div');
        wrapper.classList.add('shorten');

        [].concat(_toConsumableArray(Array(5))).map(function () {
            return wrapper.appendChild(document.createElement('span'));
        });
        [].concat(_toConsumableArray(Array(5))).map(function () {
            return wrapper.appendChild(document.createElement('a'));
        });

        var expander = document.createElement('a');
        expander.classList.add('shortener-expand');
        wrapper.appendChild(expander);
        return wrapper;
    }
});
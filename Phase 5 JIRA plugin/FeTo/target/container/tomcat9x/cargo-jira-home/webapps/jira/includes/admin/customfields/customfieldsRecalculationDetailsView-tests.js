AJS.test.require(['jira.webresources:viewcustomfields'], function () {
    'use strict';

    var CustomfieldsRecalculationDetailsView = require('jira/customfields/customfieldsRecalculationDetailsView');
    var moment = require('jira/moment');

    module('CustomfieldsRecalculationDetailsView', {
        setup: function setup() {
            this.context = AJS.test.mockableModuleContext();
            this.sandbox = sinon.sandbox.create({ useFakeServer: true });
            this.view = new CustomfieldsRecalculationDetailsView();
        },

        teardown: function teardown() {
            this.sandbox.restore();
        }
    });

    test('Shows correct data on successful load', function () {
        var lastRecalcDate = 1580295900000;

        equal(this.view.$el.html(), '', 'renders empty string when loading');

        this.sandbox.server.respondWith([200, { 'Content-Type': 'application/json' }, JSON.stringify({ value: String(lastRecalcDate) })]);
        this.sandbox.server.respond();

        equal(this.view.templateContext().issuesRecalculationDate, moment(lastRecalcDate).format('MMM DD, YYYY h:mm a'), 'formats date');
        equal(this.view.$el.text(), 'admin.issuefields.customfields.recalculation.details', 'renders content');
    });

    test('Shows correct data on load fail', function () {
        this.sandbox.server.respondWith([500, { 'Content-Type': 'application/json' }, JSON.stringify({})]);
        this.sandbox.server.respond();

        ok(this.view.$el.text().includes('admin.issuefields.customfields.recalculation.details.not.available'), 'renders error message');

        this.view.poll();
        this.sandbox.server.respondWith([200, { 'Content-Type': 'application/json' }, JSON.stringify({ value: '1' })]);
        this.sandbox.server.respond();
        equal(this.view.$el.text(), 'admin.issuefields.customfields.recalculation.details', 'renders content after subsequent successful call');

        this.view.poll();
        this.sandbox.server.respondWith([500, { 'Content-Type': 'application/json' }, JSON.stringify({})]);
        this.sandbox.server.respond();
        equal(this.view.$el.text(), 'admin.issuefields.customfields.recalculation.details', 'future fails are not rendered');
    });

    test('Supports unset application property', function () {
        this.sandbox.server.respondWith([200, { 'Content-Type': 'application/json' }, JSON.stringify({ value: null })]);
        this.sandbox.server.respond();

        ok(this.view.$el.text().includes('admin.issuefields.customfields.recalculation.details.not.available'), 'renders error message');
    });

    test('Supports default application property', function () {
        this.sandbox.server.respondWith([200, { 'Content-Type': 'application/json' }, JSON.stringify({ value: '0' })]);
        this.sandbox.server.respond();

        ok(this.view.$el.text().includes('admin.issuefields.customfields.recalculation.details.not.available'), 'renders error message');
    });

    test('Has accessible description icon', function () {
        this.sandbox.server.respondWith([200, { 'Content-Type': 'application/json' }, JSON.stringify({ value: '0' })]);
        this.sandbox.server.respond();

        ok(this.view.$el.text().includes('admin.issuefields.customfields.recalculation.details.not.available.description'), 'renders icon');
    });
});
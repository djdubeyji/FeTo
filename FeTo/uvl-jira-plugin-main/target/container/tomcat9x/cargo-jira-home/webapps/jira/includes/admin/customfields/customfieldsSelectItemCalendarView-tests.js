AJS.test.require(['jira.webresources:viewcustomfields'], function () {
    'use strict';

    var CustomfieldsSelectItemCalendarView = require('jira/customfields/customfieldsSelectItemCalendarView');
    var meta = require('jira/util/data/meta');
    var $ = require('jquery');
    var Backbone = require('jira/backbone-1.3.3');

    var CALENDAR_LABEL = 'Some label';
    var CALENDAR_NAME = 'my-name';

    module('CustomfieldsSelectItemCalendarView', {
        setup: function setup() {
            this.sandbox = sinon.sandbox.create({ useFakeServer: true });
            this.datePickerSpy = this.sandbox.spy($.fn, 'datePicker');

            $('#qunit-fixture').html("<div id='customfields-calendar'></div>");
            this.$view = $('#qunit-fixture').find('#customfields-calendar');

            this.calendarView = new CustomfieldsSelectItemCalendarView({
                el: '#customfields-calendar',
                model: new Backbone.Model({
                    name: CALENDAR_NAME,
                    label: CALENDAR_LABEL,
                    value: 0
                })
            }).render();
        },

        teardown: function teardown() {
            this.sandbox.restore();
        }
    });

    test('Renders date picker', function () {
        ok(this.datePickerSpy.calledOnce, 'Date picker called');

        equal(this.$view.find('label').text(), CALENDAR_LABEL, 'Date picker has label');
        equal(this.$view.find('input').attr('id'), 'customfields-calendar-input-' + CALENDAR_NAME, 'Date picker has id');
    });

    test('Formats date properly', function () {
        var getDateFormat = this.calendarView.getDateFormat;
        this.sandbox.stub(meta, 'get').onCall(0).returns('dd/MMM/YYYY') // 02/May/2007
        .onCall(1).returns('d/M/y') // 2/5/2007
        .onCall(2).returns('dd/MM/yyyy') // 02/05/2007
        .onCall(3).returns('YY.d.M'); // 07.5.2

        equal(getDateFormat(), 'dd/M/yy', 'Supports long month name and long year');
        equal(getDateFormat(), 'd/m/y', 'Supports month name and day without leading zero');
        equal(getDateFormat(), 'dd/mm/yy', 'Supports month name and day with leading zero');
        equal(getDateFormat(), 'y.d.m', 'Supports dots and US order');
    });
});
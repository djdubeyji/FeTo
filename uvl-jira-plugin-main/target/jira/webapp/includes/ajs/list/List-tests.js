AJS.test.require(['jira.webresources:list'], function () {
    'use strict';

    require(['jira/ajs/list/list', 'jira/ajs/list/item-descriptor', 'jquery', 'underscore'], function (List, ItemDescriptor, jQuery, _) {

        module('AJS.List', {
            buildList: function buildList(optionsOverride) {
                var $fixture = jQuery('#qunit-fixture');
                var options = {
                    containerSelector: $fixture,
                    delegateTarget: $fixture,
                    stallEventBind: false,
                    expandAllResults: true
                };
                this.options = jQuery.extend(true, options, optionsOverride);

                var clientOptions = {};
                var postActions = [];

                return {
                    withMaxResultsDisplayed: function withMaxResultsDisplayed(max) {
                        clientOptions.maxInlineResultsDisplayed = max;
                        return this;
                    },
                    withExpandAllResults: function withExpandAllResults(expandAllResults) {
                        clientOptions.expandAllResults = expandAllResults;
                        return this;
                    },
                    withTotalResults: function withTotalResults(total) {
                        postActions.push(function (list) {
                            var data = [];
                            for (var i = 0; i < total; i++) {
                                data.push(new ItemDescriptor({
                                    highlighted: true,
                                    label: 'Label #' + i,
                                    title: 'Title #' + i
                                }));
                            }
                            list.generateListFromJSON(data, 'Label');
                        });
                        return this;
                    },
                    withData: function withData(data) {
                        var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'label';

                        postActions.push(function (list) {
                            list.generateListFromJSON(data, query);
                        });
                        return this;
                    },
                    withEventsEnabled: function withEventsEnabled() {
                        postActions.push(function (list) {
                            list.enable();
                        });
                        return this;
                    },
                    withScrollAtItem: function withScrollAtItem(item) {
                        postActions.push(function () {
                            var keyEvent = jQuery.Event('keydown');
                            keyEvent.which = jQuery.ui.keyCode.DOWN;

                            for (var i = 0; i < item; i++) {
                                $fixture.trigger(keyEvent);
                            }
                        });
                        return this;
                    },
                    withLoopThroughOptions: function withLoopThroughOptions() {
                        clientOptions.loopThroughOptions = true;
                        return this;
                    },
                    withPrioritizeExactMatches: function withPrioritizeExactMatches() {
                        clientOptions.prioritizeExactMatches = true;
                        return this;
                    },
                    withHideSuggestionCount: function withHideSuggestionCount() {
                        clientOptions.hideSuggestionCount = true;
                        return this;
                    },
                    build: function build() {
                        var list = new List(_.defaults(clientOptions, options));
                        _.each(postActions, function (action) {
                            action(list);
                        });
                        return list;
                    }
                };
            },

            pressDownArrowOn: function pressDownArrowOn(element) {
                var keyEvent = jQuery.Event('keydown');
                keyEvent.which = jQuery.ui.keyCode.DOWN;
                element.trigger(keyEvent);
            }
        });

        test('List should use title from AJS.ItemDescriptor', function () {
            var data = [new ItemDescriptor({ label: 'Label with title', title: 'some tile' }), new ItemDescriptor({ label: 'Label without title' }), new ItemDescriptor({ label: 'Label with empty tile', title: '' })];
            this.buildList().withData(data).build();

            var links = jQuery('#qunit-fixture').find('.aui-list-item-link');
            equal(links.length, 3, 'There should be three links rendered');
            equal(jQuery(links.get(0)).prop('title'), data[0].title(), 'Link have valid title');
            equal(jQuery(links.get(0)).text(), data[0].label(), 'Link have valid text');
            equal(jQuery(links.get(1)).text(), data[1].label(), 'Link have valid text');
            equal(jQuery(links.get(2)).text(), data[2].label(), 'Link have valid text');
        });

        test('List should use passed in HTML tag for items', function () {
            var data = [new ItemDescriptor({ label: 'Label with title', title: 'some tile' })];
            this.buildList({ listItemTag: 'span' }).withData(data).build();

            var links = jQuery('#qunit-fixture').find('.aui-list-item-link');
            equal(links.length, 1, 'There should be one link rendered');
            equal(jQuery(links.get(0)).prop('tagName'), 'SPAN', 'Passed tag is used for links');
            equal(jQuery(links.get(0)).attr('role'), 'presentation', 'Items have valid roles');
            equal(jQuery(links.get(0)).attr('class'), 'aui-list-item-link', 'Items have valid class');
        });

        test('List should use anchor for items if no HTML tag was passed as option', function () {
            var data = [new ItemDescriptor({ label: 'Label with title', title: 'some tile' })];
            this.buildList().withData(data).build();

            var links = jQuery('#qunit-fixture').find('.aui-list-item-link');
            equal(links.length, 1, 'There should be one link rendered');
            equal(jQuery(links.get(0)).prop('tagName'), 'A', 'Anchor is a default tag for links');
            equal(jQuery(links.get(0)).attr('role'), 'presentation', 'Items have valid roles');
            equal(jQuery(links.get(0)).attr('class'), 'aui-list-item-link', 'Items have valid class');
        });

        test('List should prepend passed prefix to subtext', function () {
            var data = [new ItemDescriptor({
                label: 'main text',
                keywords: 'subtext Label' // it has to contain "Label" to fit a search query or else it won't be displayed
            })];
            this.buildList({ subtextPrefix: ' £@! some prefix -' }).withData(data).build();

            var mainTexts = jQuery('#qunit-fixture .aui-item-text');
            var subTexts = jQuery('#qunit-fixture .aui-item-suffix');
            equal(jQuery(mainTexts.get(0)).text(), 'main text', 'Main text is set correctly');
            equal(jQuery(subTexts.get(0)).text(), ' £@! some prefix - subtext Label', 'Subtext is prepended with passed prefix');
        });

        test('Protect against XSS vulnerability injected in descriptor icon', function () {
            var xssCallApi = {
                xssCall: function xssCall() {}
            };
            var mock = sinon.mock(xssCallApi);
            mock.expects('xssCall').never();
            window.xssCall = xssCallApi.xssCall;

            var data = [new AJS.ItemDescriptor({
                label: 'Label with title',
                title: 'some tile',
                icon: function icon() {
                    return 'genericissue.png"><script>window.xssCall()</script>';
                }
            })];

            this.buildList().withData(data).build();

            window.xssCall = null;
            expect(0);
        });

        test('It limits the number of results displayed', function () {
            this.buildList().withMaxResultsDisplayed(10).withTotalResults(20).build();

            var listContainer = jQuery('#qunit-fixture');
            equal(listContainer.find('.aui-list-item-link').length, 10, 'Only 10 links are rendered');
        });

        test('It displays a \'View more\' link when there is too many results if expandAllResults is true', function () {
            this.buildList().withMaxResultsDisplayed(10).withExpandAllResults(true).withTotalResults(20).build();

            var listContainer = jQuery('#qunit-fixture');
            equal(listContainer.find('button.view-all').length, 1, 'There is one \'view-all\' button');
        });

        test('It does not display a \'View more\' link when there is too many results if expandAllResults is false', function () {
            this.buildList().withMaxResultsDisplayed(10).withExpandAllResults(false).withTotalResults(20).build();

            var listContainer = jQuery('#qunit-fixture');
            equal(listContainer.find('button.view-all').length, 0, 'There is not \'view-all\' button');
        });

        test('\'View more\' expand the list so it contains all the results', function () {
            this.buildList().withMaxResultsDisplayed(10).withTotalResults(20).build();

            var listContainer = jQuery('#qunit-fixture');
            listContainer.find('button.view-all').click();

            equal(listContainer.find('.aui-list-item-link').length, 20, 'All the results are rendered');
        });

        test('In a limited list, scrolling down using arrow keys expand all the list when reaching the last item if expandAllResults is true', function () {
            this.buildList().withMaxResultsDisplayed(3).withTotalResults(6).withEventsEnabled().withScrollAtItem(2).build();

            var listContainer = jQuery('#qunit-fixture');
            this.pressDownArrowOn(listContainer);

            equal(listContainer.find('.aui-list-item-link').length, 6, 'All the results are rendered');
            equal(listContainer.find('button.view-all').length, 0, 'The \'view-all\' link is removed');
        });

        test('In a limited list, scrolling down using arrow keys does not expand the list when reaching the last item if expandAllResults is false', function () {
            this.buildList().withMaxResultsDisplayed(3).withTotalResults(6).withExpandAllResults(false).withEventsEnabled().withScrollAtItem(2).build();

            var listContainer = jQuery('#qunit-fixture');
            this.pressDownArrowOn(listContainer);

            equal(listContainer.find('.aui-list-item-link').length, 3, 'Three links are rendered');
        });

        test('It triggers an event when item is active/focused.', function () {
            var list = this.buildList().withMaxResultsDisplayed(3).withTotalResults(6).withExpandAllResults(false).withLoopThroughOptions().withEventsEnabled().withScrollAtItem(2).build();
            var callback = sinon.spy();

            list.bind('itemFocus', callback);
            var listContainer = jQuery('#qunit-fixture');
            this.pressDownArrowOn(listContainer);
            this.pressDownArrowOn(listContainer);

            sinon.assert.calledTwice(callback);
            equal(callback.secondCall.args[1], list.getFocused()[0], 'Correct item is passed as an argument.');
        });

        test('Stops at the last element by default', function () {
            this.buildList().withEventsEnabled().withMaxResultsDisplayed(3).withTotalResults(3).withExpandAllResults(false).withScrollAtItem(2).build();

            var listContainer = jQuery('#qunit-fixture');
            this.pressDownArrowOn(listContainer);

            ok(listContainer.find('ul li:last-child').hasClass('active'));
        });

        test('Cycles back from the top when configured', function () {
            this.buildList().withEventsEnabled().withMaxResultsDisplayed(3).withTotalResults(3).withExpandAllResults(false).withScrollAtItem(2).withLoopThroughOptions().build();

            var listContainer = jQuery('#qunit-fixture');
            this.pressDownArrowOn(listContainer);

            ok(listContainer.find('ul li:first-child').hasClass('active'));
        });

        test('when prioritizeExactMatches is false should not change the order of items in the list', function () {
            // given
            var labels = ['base type', 'baseline type', 'color type', 'custom type', 'magic type', 'type'];
            var customData = labels.map(function (value) {
                return new ItemDescriptor({
                    highlighted: true,
                    label: value,
                    title: value
                });
            });
            var queryText = 'type';

            // when
            this.buildList().withMaxResultsDisplayed(5).withExpandAllResults(true).withData(customData, queryText).build();

            // then
            var listContainer = jQuery('#qunit-fixture');
            var firstItem = listContainer.find('ul li:first-child');
            equal(firstItem.text(), 'base type', 'The first item in the list is not changed');
        });

        test('when prioritizeExactMatches is true should set exact matches first in the list', function () {
            // given
            var labels = ['base type', 'baseline type', 'color type', 'custom type', 'magic type', 'new type', 'old type', 'solo type', 'some type', 'system type', 'type', 'uber type', 'Type', 'uniform type'];
            var customData = labels.map(function (value) {
                return new ItemDescriptor({
                    highlighted: true,
                    label: value,
                    title: value
                });
            });
            var queryText = 'type';

            // when
            this.buildList().withPrioritizeExactMatches().withMaxResultsDisplayed(5).withExpandAllResults(true).withData(customData, queryText).build();

            // then
            var listContainer = jQuery('#qunit-fixture');
            var firstItem = listContainer.find('ul li:first-child');
            var secondItem = listContainer.find('ul li:nth-child(2)');
            var thirdItem = listContainer.find('ul li:nth-child(3)');
            equal(firstItem.text(), 'type', 'First exact match is first in the list');
            equal(secondItem.text(), 'Type', 'Another exact match is second in the list');
            equal(thirdItem.text(), 'base type', 'Next item in the list is the first from the filtered results');
        });

        test('when hideSuggestionCount is false should display the default footer message with suggestion count', function () {
            // given
            var labels = ['base type', 'baseline type', 'color type', 'custom type', 'magic type', 'type'];
            var customData = labels.map(function (value) {
                return new ItemDescriptor({
                    highlighted: true,
                    label: value,
                    title: value
                });
            });
            var queryText = 'type';

            // when
            this.buildList().withMaxResultsDisplayed(5).withExpandAllResults(false).withData(customData, queryText).build();

            // then
            var listContainer = jQuery('#qunit-fixture');
            var footerItem = listContainer.find('ul li:last-child');
            equal(footerItem.text(), 'common.concepts.too.many.matches', 'The footer item has the default message');
        });

        test('when hideSuggestionCount is true should display the footer message without suggestion count', function () {
            // given
            var labels = ['base type', 'baseline type', 'color type', 'custom type', 'magic type', 'new type', 'old type', 'solo type', 'some type', 'system type', 'type', 'uber type', 'Type', 'uniform type'];
            var customData = labels.map(function (value) {
                return new ItemDescriptor({
                    highlighted: true,
                    label: value,
                    title: value
                });
            });
            var queryText = 'type';

            // when
            this.buildList().withHideSuggestionCount().withExpandAllResults(false).withMaxResultsDisplayed(5).withData(customData, queryText).build();

            // then
            var listContainer = jQuery('#qunit-fixture');
            var footerItem = listContainer.find('ul li:last-child');
            equal(footerItem.text(), 'common.concepts.continue.typing.to.refine.further', 'The footer item has correct message');
        });
    });
});
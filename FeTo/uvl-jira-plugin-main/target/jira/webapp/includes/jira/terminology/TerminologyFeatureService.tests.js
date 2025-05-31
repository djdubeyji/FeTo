AJS.test.require(['jira.webresources:terminology-feature-service'], function () {
    'use strict';

    module('TerminologyFeatureService', {
        setup: function setup() {
            var _this = this;

            // Represents terminology related data retrieved via wrm/data
            this.terminologyData = {
                terminologyEntries: [{
                    originalName: 'sprint',
                    newName: 'Potato',
                    newNamePlural: 'Potatoes',
                    isDefault: false
                }, {
                    originalName: 'epic',
                    newName: 'Orange',
                    newNamePlural: 'Oranges',
                    isDefault: false
                },
                // these are here just for unit testing purpose, in reality we should only get 2 entries
                {
                    originalName: 'sprint',
                    newName: 'sprint',
                    newNamePlural: 'sprints',
                    isDefault: true
                }, {
                    originalName: 'epic',
                    newName: 'epic',
                    newNamePlural: 'epics',
                    isDefault: true
                }],
                isTerminologyActive: true
            };
            this.isFeatureEnabled = true;
            this.languageLocale = 'en-AU';
            this.wrmData = {
                claim: function claim() {
                    return _this.terminologyData;
                }
            };
            this.meta = {
                get: function get() {
                    return _this.languageLocale;
                }
            };
            this.mockedContext = AJS.test.mockableModuleContext();
            this.mockedContext.mock('wrm/data', this.wrmData);
            this.mockedContext.mock('jira/util/data/meta', this.meta);
            this.terminologyFeatureService = this.mockedContext.require('jira/terminology-feature-service');
            this.sandbox = sinon.sandbox.create();
            this.sandbox.stub(this.terminologyFeatureService, 'isTerminologyEnabled', function () {
                return _this.isFeatureEnabled;
            });
        },
        teardown: function teardown() {
            this.sandbox.restore();
        }
    });

    test('Returns correct terminology entries ', function () {
        equal(this.terminologyFeatureService.getTerminologyEntries().length, 2);
        var sprintEntry = this.terminologyFeatureService.getTerminologyEntryForTerm('sprint');
        var epicEntry = this.terminologyFeatureService.getTerminologyEntryForTerm('epic');
        notOk(sprintEntry.isDefault);
        equal(sprintEntry.originalName, 'sprint');
        notOk(epicEntry.isDefault);
        equal(epicEntry.originalName, 'epic');
    });

    test('Should return true when terminology is active for user', function () {
        ok(this.terminologyFeatureService.isTerminologyActiveForUser());
    });
    test('Terminology is not active for user with non english locale', function () {
        this.languageLocale = 'nl-NL';
        notOk(this.terminologyFeatureService.isTerminologyActiveForUser());
    });
    test('Terminology is not active for user when feature is disabled', function () {
        this.isFeatureEnabled = false;
        notOk(this.terminologyFeatureService.isTerminologyActiveForUser());
    });
    test('Terminology is not active for user when terminology is not changed in the instance', function () {
        this.terminologyData.isTerminologyActive = false;
        notOk(this.terminologyFeatureService.isTerminologyActiveForUser());
    });
});
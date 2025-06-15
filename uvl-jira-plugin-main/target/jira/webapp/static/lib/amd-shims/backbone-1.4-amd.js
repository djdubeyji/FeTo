define('jira/backbone-1.4', [
    'jquery',
    'atlassian/libs/underscore-1.13',
    'atlassian/libs/factories/backbone-1.4',
], function (
    $,
    _,
    BackboneFactory
) {
    return BackboneFactory(_, $);
});
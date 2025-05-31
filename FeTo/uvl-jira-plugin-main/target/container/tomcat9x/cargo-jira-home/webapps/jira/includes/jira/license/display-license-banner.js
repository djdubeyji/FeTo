require(['jira/license-banner', 'wrm/context-path'], function (licenseBanner, wrmContextPath) {
    'use strict';

    var contextPath = wrmContextPath();

    fetch(contextPath + '/rest/internal/1.0/licensebanner/markup').then(function (resp) {
        return resp.json();
    }).then(function (licenseData) {
        licenseBanner.showLicenseBanner(licenseData.bannerMarkup);
        licenseBanner.showLicenseFlag(licenseData.flagMarkup);
    }).catch(function (err) {
        return console.error('There was an error during the fetching of licence markups.', err);
    });
});
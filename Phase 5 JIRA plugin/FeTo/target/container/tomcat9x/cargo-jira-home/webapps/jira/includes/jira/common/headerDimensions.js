requestAnimationFrame(function () {
    'use strict';

    var logger = require('jira/util/logger');

    var leftElements = document.querySelectorAll("#header .aui-header-primary > ul > li");
    var rightElements = document.querySelectorAll("#header .aui-header-secondary > ul > li");
    var jiraAppHeaderSkeletonDimensions = {
        headerDimensions: []
    };
    var appLink = document.querySelector("#header .aui-header-inner .aui-header-before");
    var appLinkWidth = appLink ? appLink.getBoundingClientRect() : 0;
    var logo = document.querySelector("#header .aui-header-primary #logo");
    var logoWidth = logo ? logo.firstElementChild.firstElementChild.getBoundingClientRect() : 0;
    if (appLinkWidth) {
        jiraAppHeaderSkeletonDimensions.headerDimensions.push(appLinkWidth);
    }
    if (logoWidth) {
        jiraAppHeaderSkeletonDimensions.headerDimensions.push(logoWidth);
    }
    var header = document.querySelector("#header");
    jiraAppHeaderSkeletonDimensions.headerWidth = header ? header.clientWidth : window.innerWidth;

    function getLeftDimensions(element) {
        var requiredCSSProperties = function (_ref) {
            var marginLeft = _ref.marginLeft,
                marginRight = _ref.marginRight,
                paddingLeft = _ref.paddingLeft,
                paddingRight = _ref.paddingRight;
            return {
                marginLeft: marginLeft,
                marginRight: marginRight,
                paddingLeft: paddingLeft,
                paddingRight: paddingRight
            };
        }(window.getComputedStyle(element.firstElementChild));
        var marginPaddingSum = element.firstElementChild && element.firstElementChild.id === 'create_link' ? 0 : Object.keys(requiredCSSProperties).reduce(function (sum, key) {
            return sum + parseFloat(requiredCSSProperties[key] || 0);
        }, 0);
        var elementDimensions = element.firstElementChild.getBoundingClientRect();
        var beforePseudoWidth = window.getComputedStyle(element.firstElementChild, ':before').width;
        elementDimensions.width = beforePseudoWidth.includes('px') ? elementDimensions.width + parseFloat(beforePseudoWidth) - marginPaddingSum : elementDimensions.width - marginPaddingSum;
        jiraAppHeaderSkeletonDimensions.headerDimensions.push(elementDimensions);
    }

    function getRightDimension(element) {
        var innerElement = element.firstElementChild;
        var iconWidth = innerElement.firstElementChild ? innerElement.firstElementChild.getBoundingClientRect() : innerElement.getBoundingClientRect();
        jiraAppHeaderSkeletonDimensions.headerDimensions.push(iconWidth);
    }

    leftElements.forEach(getLeftDimensions);
    rightElements.forEach(getRightDimension);

    saveDimensionsToLocalStorage(jiraAppHeaderSkeletonDimensions);

    function saveDimensionsToLocalStorage(jiraAppHeaderSkeletonDimensions) {
        try {
            localStorage.setItem("jira-app-header-skeleton-dimensions", JSON.stringify(jiraAppHeaderSkeletonDimensions));
        } catch (exception) {
            logger.error(exception);
        }
    }
});
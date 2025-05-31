(function () {
    'use strict';

    var setSvgAttributes = function setSvgAttributes(distanceFromLeft, padding, svgWidth, svgHeight, svgFill, rx, svgId, svgNode, maskID) {
        var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", distanceFromLeft);
        rect.setAttribute("y", padding);
        rect.setAttribute("width", svgWidth);
        rect.setAttribute("height", svgHeight);
        rect.setAttribute("fill", svgFill);
        rect.setAttribute("rx", rx);
        if (maskID) {
            rect.setAttribute("mask", maskID);
        }
        svgNode.appendChild(rect);
    };

    function createSvgElements(svgDimensions, setSvgAttributes, maskId, svgId, applyAnimationToSvg) {
        var parentElement = document.createElement("div");
        var mask = document.createElement("mask");
        mask.setAttribute("id", svgId);
        var defs = document.createElement("defs");
        defs.appendChild(mask);
        parentElement.appendChild(defs);
        var svgColor = "#556E9E";
        var svgMaskColor = "#dadada";
        var padding = "8";
        var svgHeight = "24";
        var svgHorizontalRadius = "2";

        function svgAttributes(dimension, index) {
            var distanceFromLeft = svgDimensions[index].left;
            setSvgAttributes(distanceFromLeft, padding, svgDimensions[index].width, svgHeight, svgColor, svgHorizontalRadius, svgId, mask);
            setSvgAttributes(distanceFromLeft, padding, svgDimensions[index].width, svgHeight, svgMaskColor, svgHorizontalRadius, svgId, parentElement, maskId);
        }

        svgDimensions.forEach(svgAttributes);

        applyAnimationToSvg(mask);

        return parentElement.innerHTML;
    }

    var applyAnimationToSvg = function applyAnimationToSvg(svgNode) {
        var animation = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        animation.setAttribute("width", "140");
        animation.setAttribute("height", "35");
        animation.setAttribute("fill", "hsla(200,0%,10%,.2)");
        animation.setAttribute("id", "mask");
        svgNode.appendChild(animation);
    };

    function isInDesiredForm(str) {
        return (/^([1-9]\d*)$/.test(str)
        );
    }

    function validateArray(dimensions) {
        dimensions.forEach(function (dimension, index) {
            if (isInDesiredForm(parseInt(dimension.width)) && isInDesiredForm(parseInt(dimension.left))) {
                dimensions[index].width = parseInt(dimensions[index].width);
                dimensions[index].left = parseInt(dimensions[index].left);
            } else {
                throw "Invalid data";
            }
        });

        return dimensions;
    }

    function validate(jiraAppHeaderSkeletonDimensions) {
        var headerDimensions = jiraAppHeaderSkeletonDimensions.headerDimensions,
            headerWidth = jiraAppHeaderSkeletonDimensions.headerWidth;

        if (Array.isArray(headerDimensions) && headerDimensions.length > 0 && isInDesiredForm(headerWidth)) {
            jiraAppHeaderSkeletonDimensions.headerDimensions = validateArray(headerDimensions);
            jiraAppHeaderSkeletonDimensions.headerWidth = parseInt(headerWidth);
        } else {
            throw "Invalid data";
        }
        return jiraAppHeaderSkeletonDimensions;
    }

    var headerDimensions = [{ left: 10, width: 24 }, { left: 30, width: 70 }, { left: 106, width: 92 }, { left: 204, width: 92 }, { left: 302, width: 92 }, { left: 400, width: 92 }, { left: 498, width: 70 }, { left: 1426, width: 170 }, { left: 1616, width: 24 }, { left: 1660, width: 24 }, { left: 1704, width: 24 }, { left: 1748, width: 24 }];

    var headerWidth = window.innerWidth;
    try {
        var jiraAppHeaderSkeletonDimensions = JSON.parse(localStorage.getItem("jira-app-header-skeleton-dimensions"));
        validate(jiraAppHeaderSkeletonDimensions);
        headerDimensions = jiraAppHeaderSkeletonDimensions.headerDimensions;
        headerWidth = jiraAppHeaderSkeletonDimensions.headerWidth;
    } catch (exception) {
        console.error(exception);
    }
    window.__jiraAppHeaderSkeleton = {
        headerSvg: createSvgElements(headerDimensions, setSvgAttributes, "url(#other-element)", "other-element", applyAnimationToSvg),
        headerWidth: headerWidth
    };
})();
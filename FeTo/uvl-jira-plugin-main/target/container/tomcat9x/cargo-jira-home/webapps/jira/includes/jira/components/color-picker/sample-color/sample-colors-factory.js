define('jira/components/color-picker/sample-color/sample-colors-factory', ['jira/backbone-1.3.3'], function (Backbone) {
    "use strict";

    var colorsList = ['#F7E402', '#F6BC17', '#F29328', '#EF612C', '#EC3536', '#ED335A', '#EC2F8E', '#C9359A', '#A23F9D', '#80419D', '#6348A1', '#2E4FA5', '#0B69B3', '#00A3DD', '#00B4D7', '#02B2BC', '#01AE72', '#279904', '#FBF180', '#FADD8B', '#F8C993', '#F7B095', '#F59A9A', '#F699AC', '#F597C6', '#E49ACC', '#D09FCE', '#BFA0CE', '#B1A3D0', '#96A7D2', '#85B4D9', '#7FD1EE', '#7FD9EB', '#80D8DD', '#80D6B8', '#93CC81', '#333333', '#5C5C5C', '#858585', '#999999', '#C1C1C1', '#D6D6D6', '#62768B', '#8192A3', '#A1ADBA', '#B0BAC5', '#CFD6DC', '#E0E4E8', '#9B8E83', '#837264', '#B4AAA2', '#CDC7C1', '#D9D4D0', '#E6E3E0'];

    var colorsObjectsList = colorsList.map(function (color) {
        return { color: color };
    });

    return function () {
        return new Backbone.Collection(colorsObjectsList);
    };
});
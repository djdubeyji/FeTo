<%--
All changes in this jsp must be mirrored in general.jsp
--%>
<%@ taglib prefix="ww" uri="webwork" %>
<%@ taglib uri="jiratags" prefix="jira" %>
    <script>
        document.getElementById("header-skeleton").remove();
    </script>
    <header id="header" role="banner">
        <%@ include file="/includes/decorators/aui-layout/notifications-header.jsp" %>
        <%@ include file="/includes/decorators/unsupported-browsers.jsp" %>
        <%@ include file="/includes/decorators/aui-layout/header-nodecorator.jsp" %>
    </header>
    <%@ include file="/includes/decorators/aui-layout/notifications-content.jsp" %>
    <div id="content">

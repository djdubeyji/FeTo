<%@ page import="com.atlassian.jira.web.util.ProductVersionDataBeanProvider" %>
<%@ page import="com.atlassian.plugin.webresource.WebResourceManager" %>
<%@ taglib prefix="decorator" uri="sitemesh-decorator" %>
<%@ taglib uri="jiratags" prefix="jira" %>
<%
    WebResourceManager webResourceManager = ComponentAccessor.getComponent(WebResourceManager.class);
    webResourceManager.requireResourcesForContext("atl.general");
    webResourceManager.requireResourcesForContext("jira.general");
%>
<!DOCTYPE html>
<html lang="<%= ComponentAccessor.getJiraAuthenticationContext().getI18nHelper().getLocale().getLanguage() %>">
<head>
    <%@ include file="/includes/decorators/aui-layout/head-common.jsp" %>
    <%@ include file="/includes/decorators/aui-layout/head-resources.jsp" %>
    <decorator:head/>
</head>
<body id="jira" class="aui-layout aui-theme-default page-type-printable <jira:a11y-classes/> <decorator:getProperty property="body.class" />" <%= ComponentAccessor.getComponent(ProductVersionDataBeanProvider.class).get().getBodyHtmlAttributes() %>>
<header id="previous-view">
    <nav class="aui-toolbar">
        <div class="toolbar-split toolbar-split-right">
            <ul class="toolbar-group">
                <li class="toolbar-item">
                    <a href="#" onclick="javascript:history.go(-1);" class="toolbar-trigger"><ww:text name="'common.concepts.back.to.previous.view'"/></a>
                </li>
            </ul>
        </div>
    </nav>
</header>
<div id="printable-content">
    <decorator:body />
</div>
<script>
require(["jquery"], function ($) {
    // Prevent click events from doing stuff in this view
    $(function () { // eslint-disable-line @atlassian/onready-checks/no-jquery-onready
        $('#printable-content *').unbind('click').click(function(e){ e.preventDefault() }).removeAttr('onclick');
        // Remove all dangerous HTML tags from the text
        $('#printable-content').textContent($('#printable-content'))
    });
});
</script>
<%@ include file="/includes/decorators/aui-layout/endbody-resources.jsp" %>
</body>
</html>

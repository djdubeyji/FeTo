<%@ page import="com.atlassian.jira.config.properties.LookAndFeelBean" %>
<%@ page import="com.atlassian.jira.config.properties.ApplicationProperties" %>
<%--
All changes in this jsp must be mirrored in general.jsp
--%>
<!DOCTYPE html>
<html lang="<%= ComponentAccessor.getJiraAuthenticationContext().getI18nHelper().getLocale().getLanguage() %>">
<head>
    <%@ include file="/includes/decorators/aui-layout/head-common-nodecorator-pre.jsp" %>
    <%@ include file="/includes/decorators/aui-layout/head-resources.jsp" %>
    <%@ include file="/includes/decorators/aui-layout/head-common-nodecorator-post.jsp" %>
</head>
<body id="jira" class="aui-layout aui-theme-default">
<div id="page">
    <% final LookAndFeelBean lookAndFeelBean = LookAndFeelBean.getInstance(ComponentAccessor.getApplicationProperties()); %>
    <div id="header-skeleton" class="aui-header" style="--aui-appheader-bg-color: <%= lookAndFeelBean.getTopBackgroundColour() %>; position: absolute; width: 100%; padding: 0">
        <span elementtiming="app-header-skeleton"> </span>
        <script>
            performance.mark("app-header-skeleton");
        </script>
        <%@ include file="/includes/decorators/aui-layout/app-header-skeleton.jsp"%>
    </div>

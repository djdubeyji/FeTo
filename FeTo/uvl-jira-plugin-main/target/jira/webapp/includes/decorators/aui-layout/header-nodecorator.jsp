<%@ page import="com.atlassian.jira.component.ComponentAccessor" %>
<%@ page import="com.atlassian.jira.plugin.navigation.HeaderFooterRendering" %>
<%
    ComponentAccessor.getComponent(HeaderFooterRendering.class).includeTopNavigation(out, request);
%>

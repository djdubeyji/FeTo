<%@ page import="com.atlassian.jira.plugin.navigation.HeaderFooterRendering" %>
<%@ page import="com.atlassian.jira.component.ComponentAccessor" %>

<%
    ComponentAccessor.getComponent(HeaderFooterRendering.class).flushRemainingResources(out, request);
    ComponentAccessor.getComponent(HeaderFooterRendering.class).includeAccessLogImprints(out, request);
%>

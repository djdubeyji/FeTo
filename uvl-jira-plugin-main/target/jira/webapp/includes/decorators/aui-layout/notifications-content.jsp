<%@ page import="com.atlassian.jira.admin.AnnouncementBanner" %>
<%@ page import="com.atlassian.jira.component.ComponentAccessor" %>
<%
    AnnouncementBanner banner = ComponentAccessor.getComponentOfType(AnnouncementBanner.class);
    if (banner.isDisplay())
    {
%>
<section id="announcement-banner" class="alertHeader" aria-label="<%= banner.getBannerLabel() %>" tabindex="0">
    <%= banner.getViewHtml() %>
</section>
<%
    }
%>

<%--
All changes in this jsp must be mirrored in head-common.jsp
--%>
<%@ page import="com.atlassian.jira.plugin.navigation.HeaderFooterRendering" %>
<%@ page import="static com.atlassian.jira.component.ComponentAccessor.*" %>
<%@ page import="com.atlassian.jira.component.ComponentAccessor" %>
<%@ page import="webwork.util.TextUtil" %>
<%@ taglib uri="sitemesh-decorator" prefix="decorator" %>
<%@ taglib uri="jiratags" prefix="jira" %>
<%@ taglib uri="webwork" prefix="ww" %>
<%
    //TODO: this is already defined elsewhere - hence the "1". Find a way to make it less shitty. Maybe some new tags?
    HeaderFooterRendering headerFooterRendering1 = getComponent(HeaderFooterRendering.class);

    // There's no reason to delay an early brow flush, so we leave this for the chin flush (micro optimisation).
    headerFooterRendering1.includeGoogleSiteVerification(out);

    // Extra metadata and resources might have been required since the head-pre was written, so we need to drain
    // and write them out.
    headerFooterRendering1.includeMetadata(out);

    final String loadingText = ComponentAccessor.getJiraAuthenticationContext().getI18nHelper().getText("common.concepts.loading");
%>

<title><%= loadingText %></title>
<link id="open-search-description-link" rel="search" type="application/opensearchdescription+xml" href="<%= request.getContextPath()%>/osd.jsp" title="<%= TextUtil.escapeHTML(loadingText) %>"/>


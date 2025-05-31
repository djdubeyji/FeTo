<%@ page import="com.atlassian.jira.component.ComponentAccessor" %>
<%@ page import="com.atlassian.jira.plugin.navigation.HeaderFooterRendering" %>
<%@ page import="com.atlassian.web.servlet.api.LocationUpdater" %>
<%@ page import="com.atlassian.jira.web.pagebuilder.CommonWebResourcesProvider" %>
<%@ page import="com.atlassian.jira.web.action.util.FieldsResourceIncluder" %>
<%@ page import="com.atlassian.jira.web.pagebuilder.CommonWebResourcesProvider" %>

<!--[if IE]><![endif]--><%-- Leave this here - it stops IE blocking resource downloads - see http://www.phpied.com/conditional-comments-block-downloads/ --%>
<script type="text/javascript">
    (function() {
        var contextPath = '<%=request.getContextPath()%>';

        function printDeprecatedMsg() {
            if (console && console.warn) {
                console.warn('DEPRECATED JS - contextPath global variable has been deprecated since 7.4.0. Use `wrm/context-path` module instead.');
            }
        }

        Object.defineProperty(window, 'contextPath', {
            get: function() {
                printDeprecatedMsg();
                return contextPath;
            },
            set: function(value) {
                printDeprecatedMsg();
                contextPath = value;
            }
        });
    })();

</script>
<%
    final LocationUpdater locationUpdater = ComponentAccessor.getOSGiComponentInstanceOfType(LocationUpdater.class);
    locationUpdater.updateLocation(out);

    CommonWebResourcesProvider commonWebResourcesProvider = ComponentAccessor.getComponent(CommonWebResourcesProvider.class);
    commonWebResourcesProvider.requireCommonWebResources();
    commonWebResourcesProvider.drainIncludedWebResources(out);

    HeaderFooterRendering headerAndFooter = ComponentAccessor.getComponent(HeaderFooterRendering.class);
    headerAndFooter.includeWebPanels(out, "atl.header.after.scripts");
%>

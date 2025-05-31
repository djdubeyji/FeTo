<%@ page import="com.atlassian.jira.license.LicenseBannerHelper" %>
<%@ page import="static com.atlassian.jira.component.ComponentAccessor.getComponentOfType" %>

<%
    final LicenseBannerHelper licenseBanner = getComponentOfType(LicenseBannerHelper.class);
    final boolean canViewLicenseInfo = licenseBanner.canViewLicenseInfo();
    if (!canViewLicenseInfo)
    {
%>

<script type="module">
    require(['wrm/require-lazily'], function (wrmRequireLazily) {
        'use strict';

        wrmRequireLazily('wrc!jira.webresources:license-banner-resource');
    });
</script>
<%
    }
%>


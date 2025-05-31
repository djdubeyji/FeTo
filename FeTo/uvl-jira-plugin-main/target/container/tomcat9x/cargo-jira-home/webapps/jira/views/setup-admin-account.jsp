<%@ page import="com.atlassian.jira.component.ComponentAccessor" %>
<%@ page import="com.atlassian.jira.license.LegitimacyLicenseCheck" %>
<%@ page import="com.atlassian.jira.security.JiraAuthenticationContext" %>
<%@ page import="com.atlassian.jira.util.I18nHelper" %>
<%@ taglib uri="webwork" prefix="ww" %>
<%@ taglib uri="webwork" prefix="ui" %>
<%@ taglib uri="webwork" prefix="aui" %>
<%@ taglib uri="sitemesh-page" prefix="page" %>
<%
    // don't show ANYTHING to the user if they come here looking for trouble
    if (com.atlassian.jira.util.JiraUtils.isSetup()) {
%>
<%--
Leave this as a raw HTML. Do not use response.getWriter() or response.getOutputStream() here as this will fail
on Orion. Let the application server figure out how it want to output this text.
--%>
Jira has already been set up.
<%
} else {
%>
<html>
<head>
    <title><ww:text name="'setup.title'"/></title>
</head>

<body>

<page:applyDecorator id="jira-setupwizard" name="auiform">
    <page:param name="action">SetupAdminAccount.jspa</page:param>
    <page:param name="useCustomButtons">true</page:param>
    <page:param name="cssClass">top-label</page:param>

    <aui:component template="formHeading.jsp" theme="'aui'">
        <aui:param name="'text'"><ww:text name="'setup2.title'"/></aui:param>
    </aui:component>

    <div>
        <p><ww:text name="'setup2.desc'"/></p>
    </div>

    <ui:soy moduleKey="'com.atlassian.auiplugin:soy'" template="'aui.group.group'">
        <ui:param name="'content'">
            <ui:soy moduleKey="'com.atlassian.auiplugin:soy'" template="'aui.group.item'">
                <ui:param name="'content'">
                    <aui:textfield label="text('setup2.fullname.label')" name="'fullname'" theme="'aui'" size="'full'"/>
                </ui:param>
            </ui:soy>
        </ui:param>
    </ui:soy>

    <ui:soy moduleKey="'com.atlassian.auiplugin:soy'" template="'aui.group.group'">
        <ui:param name="'content'">
            <ui:soy moduleKey="'com.atlassian.auiplugin:soy'" template="'aui.group.item'">
                <ui:param name="'content'">
                    <aui:textfield label="text('setup2.email.label')" name="'email'" theme="'aui'" size="'full'"/>
                </ui:param>
            </ui:soy>
        </ui:param>
    </ui:soy>

    <ui:soy moduleKey="'com.atlassian.auiplugin:soy'" template="'aui.group.group'">
        <ui:param name="'content'">
            <ui:soy moduleKey="'com.atlassian.auiplugin:soy'" template="'aui.group.item'">
                <ui:param name="'content'">
                    <aui:textfield label="text('common.words.username')" name="'username'" theme="'aui'" size="'full'"/>
                </ui:param>
            </ui:soy>
        </ui:param>
    </ui:soy>

    <ui:soy moduleKey="'com.atlassian.auiplugin:soy'" template="'aui.group.group'">
        <ui:param name="'content'">
            <ui:soy moduleKey="'com.atlassian.auiplugin:soy'" template="'aui.group.item'">
                <ui:param name="'content'">
                    <aui:password label="text('common.words.password')" name="'password'" theme="'aui'" size="'long'"/>
                </ui:param>
            </ui:soy>
            <ui:soy moduleKey="'com.atlassian.auiplugin:soy'" template="'aui.group.item'">
                <ui:param name="'content'">
                    <aui:password label="text('setup2.confirm.label')" name="'confirm'" theme="'aui'" size="'long'"/>
                </ui:param>
            </ui:soy>
        </ui:param>
    </ui:soy>

    <page:applyDecorator name="auifieldgroup">
        <page:param name="type">buttons-container</page:param>
        <page:applyDecorator name="auifieldgroup">
            <page:param name="type">buttons</page:param>
            <aui:component theme="'aui'" template="formSubmit.jsp">
                <aui:param name="'id'">jira-setupwizard-submit</aui:param>
                <aui:param name="'submitButtonName'">next</aui:param>
                <aui:param name="'submitButtonText'"><ww:text name="'common.words.next'"/></aui:param>
                <aui:param name="'submitButtonCssClass'">aui-button-primary</aui:param>
            </aui:component>
            <div class="hidden throbber-message">
                <aui-spinner size="small"></aui-spinner>
                <ww:text name="'setup2.spinner.message'"/>
            </div>
        </page:applyDecorator>
    </page:applyDecorator>

</page:applyDecorator>
<% final LegitimacyLicenseCheck licenseCheck = ComponentAccessor.getComponent(LegitimacyLicenseCheck.class);
    if (!licenseCheck.isPass()) {
        final I18nHelper i18nHelper = ComponentAccessor.getComponent(JiraAuthenticationContext.class).getI18nHelper();
%>
<script type="module">
    AJS.$(function () {
        require(['jira/flag'], function (flag) {
            flag.showWarningMsg(
                "<%= i18nHelper.getText("setup.flag.license.not.legitimate.title") %>",
                "<%= i18nHelper.getText("setup.flag.license.not.legitimate.body") %>",
                {close: "manual"}
            )
        });
    })
</script>
<%
    }
%>
</body>
</html>
<% } %>

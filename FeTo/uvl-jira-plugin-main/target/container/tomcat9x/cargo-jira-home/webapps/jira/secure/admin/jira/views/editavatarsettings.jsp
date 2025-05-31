<%--suppress CheckTagEmptyBody --%>
<%@ page import="com.atlassian.jira.component.ComponentAccessor" %>
<%@ taglib uri="webwork" prefix="ww" %>
<%@ taglib uri="webwork" prefix="ui" %>
<%@ taglib uri="webwork" prefix="aui" %>
<%@ taglib uri="sitemesh-page" prefix="page" %>
<!DOCTYPE html>
<html lang="<%= ComponentAccessor.getJiraAuthenticationContext().getI18nHelper().getLocale().getLanguage() %>">
<head>
    <title><ww:text name="'admin.avatarsettings.edit.avatar.settings'"/></title>
    <meta name="admin.active.section" content="admin_system_menu/advanced_menu_section/advanced_section"/>
    <meta name="admin.active.tab" content="attachments"/>
    <meta name="decorator" content="panel-admin"/>
</head>
<body>
    <page:applyDecorator id="edit-avatar-settings" name="auiform">
        <page:param name="action">EditAvatarSettings.jspa</page:param>
        <page:param name="method">post</page:param>
        <page:param name="submitButtonText"><ww:text name="'common.forms.save'"/></page:param>
        <page:param name="submitButtonName"><ww:text name="'common.forms.save'"/></page:param>
        <page:param name="cancelLinkURI">ViewAvatarSettings.jspa</page:param>

        <aui:component template="formHeading.jsp" theme="'aui'">
            <aui:param name="'text'"><ww:text name="'admin.avatarsettings.edit.avatar.settings'"/></aui:param>
        </aui:component>

        <%-- - Use Gravatar --%>
        <ww:if test="/systemAdministrator == true">
            <page:applyDecorator name="auifieldset">
                <page:param name="type">group</page:param>
                <page:param name="legend"><ww:text name="'admin.useravatar.gravatar.option'"/></page:param>

                <page:applyDecorator name="auifieldgroup">
                    <page:param name="type">radio</page:param>
                    <%-- Set the checked state of the radio --%>
                    <ww:if test="/useGravatar == true">
                        <ww:property id="use-gravatar-enabled" value="'true'"/>
                    </ww:if>
                    <aui:radio checked="@use-gravatar-enabled" id="gravatar-enabled" label="text('admin.common.words.on')" value="true" list="null" name="'useGravatar'" theme="'aui'" />
                </page:applyDecorator>
                <page:applyDecorator name="auifieldgroup">
                    <page:param name="type">radio</page:param>
                    <%-- Set the checked state of the radio --%>
                    <ww:if test="/useGravatar == false">
                        <ww:property id="use-gravatar-disabled" value="'true'"/>
                    </ww:if>
                    <aui:radio checked="@use-gravatar-disabled" id="gravatar-disabled" label="text('admin.common.words.off')" value="false" list="null" name="'useGravatar'" theme="'aui'" />
                    <page:param name="description"><em><ww:text name="'admin.useravatar.gravatar.option.description'"></ww:text></em></page:param>
                </page:applyDecorator>
            </page:applyDecorator>

            <page:applyDecorator name="auifieldgroup">
                <aui:textfield label="text('admin.useravatar.gravatar.server')" id="'gravatarApiAddress'" mandatory="false" maxlength="40" name="'gravatarApiAddress'" theme="'aui'" />
                <page:param name="description">
                    <ww:text name="'admin.useravatar.gravatar.server.description'" value0="'<a href=\"https://www.gravatar.com\" target=\"blank\">'" value1="'</a>'"></ww:text>
                </page:param>
            </page:applyDecorator>

        </ww:if>

    </page:applyDecorator>
</body>
</html>

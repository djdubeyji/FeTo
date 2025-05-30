<%--suppress CheckTagEmptyBody --%>
<%@ taglib uri="webwork" prefix="ww" %>
<%@ taglib uri="webwork" prefix="ui" %>
<%@ taglib uri="webwork" prefix="aui" %>
<%@ taglib uri="sitemesh-page" prefix="page" %>
<html>
<head>
	<title><ww:text name="'admin.globalsettings.avatar.settings'"/></title>
    <meta name="admin.active.section" content="admin_system_menu/advanced_menu_section/advanced_section"/>
    <meta name="admin.active.tab" content="avatars"/>
</head>
<body>
    <%-- error messages --%>
    <ww:if test="hasErrorMessages == 'true'">
        <aui:component template="auimessage.jsp" theme="'aui'">
            <aui:param name="'messageType'">error</aui:param>
            <aui:param name="'titleText'"><ww:text name="'admin.common.words.errors'"/></aui:param>
            <aui:param name="'messageHtml'">
                <ul>
                    <ww:iterator value="errorMessages">
                        <li><ww:property /></li>
                    </ww:iterator>
                </ul>
            </aui:param>
        </aui:component>
    </ww:if>
    <header class="aui-page-header">
        <div class="aui-page-header-inner">
            <div class="aui-page-header-main">
                <h2><ww:text name="'admin.menu.globalsettings.avatars'"/></h2>
                <div id="avatars-settings-description" class="secondary-text">
                    <ww:text name="avatarSettingsPageDescription"/>
                    <ww:text name="'admin.avatarsettings.avatar.learn.more'"/>
                </div>
            </div>
            <ww:if test="/systemAdministrator == true">
                <div class="aui-page-header-actions">
                    <div class="aui-buttons">
                        <a id="edit-avatars" class="aui-button trigger-dialog" href="EditAvatarSettings!default.jspa">
                            <span class="aui-icon aui-icon-small aui-iconfont-edit"></span>
                            <ww:text name="'admin.common.phrases.edit.settings'"/>
                        </a>
                    </div>
                </div>
            </ww:if>
        </div>
    </header>
    <aui:component template="module.jsp" theme="'aui'">
        <aui:param name="'id'">AvatarSettings</aui:param>
        <aui:param name="'contentHtml'">
            <table class="aui aui-table-rowhover" id="table-AvatarSettings" aria-describedby="avatars-settings-description">
                <tbody>
                <tr data-avatar-setting="avatar-location">
                    <td style="width: 40%" data-cell-type="label">
                        <strong><ww:text name="'admin.avatarsettings.avatar.location'"/></strong>
                        <div class="secondary-text">
                            <ww:text name="'admin.avatarsettings.avatar.location.explanation'"/>
                        </div>
                    </td>
                    <td style="width: 60%" data-cell-type="value">
                        <ui:soy moduleKey="'jira.webresources:filestore-information-resources'" template="'JIRA.Templates.Admin.Jira.FileStoreInformation.fileStoreInformation'">
                            <ui:param name="'heading'" value="/avatarsLocation/heading" />
                            <ui:param name="'information'" value="/avatarsLocation/entries" />
                        </ui:soy>
                    </td>
                </tr>
                <tr>
                    <td><b><ww:text name="'admin.useravatar.gravatar.option'"></ww:text></b></td>
                    <td data-property-id="use-gravatar">
                        <ww:if test="/useGravatar == true">
                            <strong class="status-active"><ww:text name="'admin.common.words.on'"/></strong>
                            <ww:if test="/gravatarApiAddress">
                                - <ww:property value="/gravatarApiAddress"/>
                            </ww:if>
                        </ww:if>
                        <ww:else>
                            <strong class="status-inactive"><ww:text name="'admin.common.words.off'"/></strong>
                        </ww:else>
                    </td>
                </tr>
                </tbody>
            </table>
        </aui:param>
    </aui:component>
</body>
</html>

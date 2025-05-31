<%@ taglib uri="webwork" prefix="ww" %>
<%@ taglib uri="webwork" prefix="ui" %>
<%@ taglib uri="webwork" prefix="aui" %>
<%@ taglib uri="sitemesh-page" prefix="page" %>
<html>
<head>
    <title><ww:text name="'admin.replicationsettings.edit'"/></title>
    <meta name="admin.active.section" content="admin_system_menu/advanced_menu_section/advanced_section"/>
    <meta name="admin.active.tab" content="replication"/>
    <meta name="decorator" content="panel-admin"/>
</head>


<body>

<page:applyDecorator id="edit-replication" name="auiform">
    <page:param name="action">EditReplicationSettings.jspa</page:param>
    <page:param name="method">post</page:param>
    <page:param name="submitButtonText"><ww:text name="'common.forms.update'"/></page:param>
    <page:param name="submitButtonName"><ww:text name="'common.forms.update'"/></page:param>
    <page:param name="cancelLinkURI">ReplicationSettings!default.jspa</page:param>

    <aui:component template="formHeading.jsp" theme="'aui'">
        <aui:param name="'text'"><ww:text name="'admin.replicationsettings.edit'"/></aui:param>
    </aui:component>

    <ww:if test="/systemAdministrator == true">
        <page:applyDecorator name="auifieldset">
            <page:param name="type">group</page:param>
            <page:param name="legend"><ww:text name="'admin.replicationsettings.enable.features'"/></page:param>

            <ww:iterator value="/replicableFileTypes" status="'status'">
                <page:applyDecorator name="auifieldgroup">
                    <page:param name="type">checkbox</page:param>
                    <input type="checkbox" id="<ww:property value="./key" />" name="<ww:property value="/fileTypeCheckboxName" />"
                        value="<ww:property value="./key" />" <ww:if test="/fileTypeEnabled(.) == true"> checked </ww:if>
                        class="checkbox" />
                    <label for="<ww:property value="./key" />"><ww:text name="/i18nKey(.)" /></label>
                </page:applyDecorator>
            </ww:iterator>
        </page:applyDecorator>
    </ww:if>

</page:applyDecorator>
</body>
</html>

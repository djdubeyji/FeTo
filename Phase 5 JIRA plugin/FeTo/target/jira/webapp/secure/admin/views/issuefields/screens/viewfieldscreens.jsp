<%@ taglib uri="webwork" prefix="ww" %>
<%@ taglib uri="webwork" prefix="ui" %>
<%@ taglib uri="webwork" prefix="aui" %>
<%@ taglib uri="sitemesh-page" prefix="page" %>
<html>
<head>
    <title><ww:text name="'admin.issuefields.screens.view.screens'"/></title>
    <meta name="admin.active.section" content="admin_issues_menu/element_options_section/screens_section"/>
    <meta name="admin.active.tab" content="field_screens"/>
</head>
<body>
    <header class="aui-page-header">
        <div class="aui-page-header-inner">
            <div class="aui-page-header-main">
                <h2><ww:text name="'admin.issuefields.screens.view.screens'"/></h2>
            </div>
            <div class="aui-page-header-actions">
                <div class="aui-buttons">
                    <a id="add-field-screen" class="aui-button trigger-dialog" href="AddNewFieldScreen.jspa">
                        <ww:text name="'admin.issuefields.screens.add.screen'"/>
                    </a>
                </div>
                <aui:component name="'fieldscreens'" template="help.jsp" theme="'aui'" />
            </div>
        </div>
    </header>

    <aui:component template="auimessage.jsp" theme="'aui'">
        <aui:param name="'messageType'">info</aui:param>
        <aui:param name="'messageHtml'">
            <p><ww:text name="'admin.issuefields.screens.description'"/></p>
            <ul>
                <li>
                    <ww:text name="'admin.issuefields.screens.to.choose.screens'">
                        <ww:param name="'value0'"><b></ww:param>
                        <ww:param name="'value1'"></b></ww:param>
                        <ww:param name="'value2'"><b></ww:param>
                        <ww:param name="'value3'"></b></ww:param>
                        <ww:param name="'value4'"><a href="ViewFieldScreenSchemes.jspa"></ww:param>
                        <ww:param name="'value5'"></a></ww:param>
                    </ww:text>
                </li>
                <li>
                    <ww:text name="'admin.issuefields.screens.to.select.screens'">
                        <ww:param name="'value0'"><b></ww:param>
                        <ww:param name="'value1'"></b></ww:param>
                        <ww:param name="'value2'"><a href="ListWorkflows.jspa"></ww:param>
                        <ww:param name="'value3'"></a></ww:param>
                    </ww:text>
                </li>
            </ul>
            <p>
                <ww:text name="'admin.issuefields.screens.note1'">
                    <ww:param name="'value0'"><span class="note"></ww:param>
                    <ww:param name="'value1'"></span></ww:param>
                </ww:text>
            </p>
        </aui:param>
    </aui:component>
    <div id="field-screens-table-container"></div>
<ww:else>
    <aui:component template="auimessage.jsp" theme="'aui'">
        <aui:param name="'messageType'">info</aui:param>
        <aui:param name="'messageHtml'"><ww:text name="'admin.issuefields.screens.no.screens.configured'"/></aui:param>
    </aui:component>
</ww:else>
</body>
</html>

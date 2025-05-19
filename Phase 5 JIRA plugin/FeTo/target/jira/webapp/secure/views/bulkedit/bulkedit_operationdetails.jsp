<%@ taglib uri="webwork" prefix="ww" %>
<%@ taglib uri="webwork" prefix="ui" %>
<%@ taglib uri="webwork" prefix="aui" %>
<%@ taglib uri="sitemesh-page" prefix="page" %>
<%@ page import="com.atlassian.jira.component.ComponentAccessor" %>
<%@ page import="com.atlassian.jira.web.action.util.FieldsResourceIncluder" %>
<%
    final FieldsResourceIncluder fieldResourceIncluder = ComponentAccessor.getComponent(FieldsResourceIncluder.class);
    fieldResourceIncluder.includeFieldResourcesForCurrentUser();
%>
<html>
<head>
	<title><ww:text name="'bulkedit.title'"/></title>
</head>
<body>
    <!-- Step 3 - Bulk Operation: Operation Details -->
    <ui:soy moduleKey="'com.atlassian.auiplugin:soy'" template="'aui.page.pagePanel'">
        <ui:param name="'id'" value="'stepped-process'" />
        <ui:param name="'content'">
            <ui:soy moduleKey="'com.atlassian.auiplugin:soy'" template="'aui.page.pagePanelNav'">
                <ui:param name="'content'">
                    <jsp:include page="/secure/views/bulkedit/bulkedit_leftpane.jsp" flush="false" />
                </ui:param>
            </ui:soy>
            <ui:soy moduleKey="'com.atlassian.auiplugin:soy'" template="'aui.page.pagePanelContent'">
                <ui:param name="'content'">
                    <ui:soy moduleKey="'com.atlassian.auiplugin:soy'" template="'aui.page.pageHeader'">
                        <ui:param name="'content'">
                            <ui:soy moduleKey="'com.atlassian.auiplugin:soy'" template="'aui.page.pageHeaderMain'">
                                <ui:param name="'content'">
                                    <h2><ww:text name="'bulkedit.step3'"/>: <ww:text name="'bulkedit.step3.title'"/></h2>
                                </ui:param>
                            </ui:soy>
                        </ui:param>
                    </ui:soy>

                    <!-- check for EDIT_ISSUE permissions and show an appropriate error message if user does not have this permission -->
                    <ww:if test="hasAvailableActions == false">
                        <ww:if test="/bulkEditBean/multipleProjects == true">
                            <p>
                                <ww:text name="'bulkedit.step2.note.noactions.multiple'">
                                    <ww:param name="'value0'"><b><ww:property value="/bulkEditBean/selectedIssues/size"/></b></ww:param>
                                    <ww:param name="'value1'"><b><ww:property value="/bulkEditBean/projectIds/size"/></b></ww:param>
                                </ww:text>
                            </p>
                        </ww:if>
                        <ww:else>
                            <p>
                                <ww:text name="'bulkedit.step2.note.noactions.single'">
                                    <ww:param name="'value0'"><b><ww:property value="/bulkEditBean/selectedIssues/size"/></b></ww:param>
                                    <ww:param name="'value1'"><b><ww:property value="/bulkEditBean/projectObject/name"/></b></ww:param>
                                </ww:text>
                            </p>
                        </ww:else>
                    </ww:if>
                    <ww:else>
                        <p>
                            <ww:text name="'bulkedit.step2.desc'">
                                <ww:param name="'value0'"><b><ww:property value="/bulkEditBean/selectedIssues/size"/></b></ww:param>
                            </ww:text>
                        </p>
                    </ww:else>

                    <page:applyDecorator id="bulkedit" name="auiform">
                        <page:param name="action">BulkEditDetailsValidation.jspa</page:param>
                        <page:param name="cssClass">top-label</page:param>
                        <page:param name="useCustomButtons">true</page:param>
                        <ww:if test="hiddenActions/empty == 'false'">
                            <aui:component template="auimessage.jsp" theme="'aui'">
                                <aui:param name="'messageType'">warning</aui:param>
                                <aui:param name="'messageHtml'">
                                    <div id="unavailableActionsTable" class="twixi-block collapsed">
                                        <div class="twixi-wrap">
                                            <h3><ww:text name="'bulkedit.actions.unavailable.title'"/></h3>
                                        </div>
                                        <div class="unavailable-actions-content">
                                            <div class="twixi-wrap concise">
                                                <ww:text name="'bulkedit.actions.unavailable.description'"/>
                                            </div>
                                            <div class="twixi-wrap verbose">
                                                <ul>
                                                    <ww:iterator value="hiddenActions">
                                                        <li>
                                                            <ww:text name="'bulkedit.actions.changefield'">
                                                                <ww:param name="'value0'"><ww:property value="./fieldName" /></ww:param>
                                                            </ww:text>
                                                            <div class="description">
                                                                <ww:text name="unavailableMessage">
                                                                    <ww:param name="'value0'"><span class="highlight"></ww:param>
                                                                    <ww:param name="'value1'"></span></ww:param>
                                                                </ww:text>
                                                            </div>
                                                        </li>
                                                    </ww:iterator>
                                                </ul>
                                            </div>
                                        </div>
                                        <div class="twixi-trigger twixi-wrap verbose">
                                            <button class="aui-button aui-button-primary" id="unavailable-actions-collapse">
                                                <ww:text name="'common.concepts.collapse'"/>
                                            </button>
                                        </div>
                                        <div class="twixi-trigger twixi-wrap concise">
                                            <button class="aui-button aui-button-primary" id="unavailable-actions-expand">
                                                <ww:text name="'common.concepts.expand'"/>
                                            </button>
                                        </div>
                                    </div>
                                </aui:param>
                            </aui:component>
                        </ww:if>
                        <ww:if test="visibleActions/empty == 'false'">
                            <table id="availableActionsTable">
                                <ww:iterator value="visibleActions">
                                    <tr class="availableActionRow">
                                        <td class="cell-type-collapsed">
                                            <input class="checkbox" type="checkbox" id="cb<ww:property value="./field/id"/>" name="actions" value="<ww:property value="./field/id"/>" <ww:if test="/checked(./field/id) == true">checked</ww:if>>
                                        </td>
                                        <td style="max-width: 200px; width: 200px; word-wrap: break-word;">
                                            <label for="cb<ww:property value="./field/id"/>">
                                            <ww:text name="'bulkedit.actions.changefield'">
                                                <ww:param name="'value0'" value="./fieldName"/>
                                            </ww:text>
                                            </label>
                                        </td>
                                        <ww:if test="/changeModeSelectionAllowed(./field) == true ">
                                            <td class="availableActionMultiSelect" valign="top">
                                                <ww:property value="/multiSelectFieldsOptionsHtml(./field)" escape="'false'" />
                                            </td>
                                            <tr class="availableActionRowMultiSelect"> <td></td><td></td>
                                                <ww:property value="/fieldHtml(./field/id)" escape="'false'" />
                                            </tr>
                                        </ww:if>
                                        <ww:else>
                                            <ww:property value="/fieldHtml(./field/id)" escape="'false'" />
                                        </ww:else>
                                    </tr>
                                </ww:iterator>
                            </table>
                        </ww:if>
                        <jsp:include page="/includes/bulkedit/bulkedit-sendnotifications.jsp"/>
                        <%@include file="bulkchooseaction_submit_buttons.jsp"%>
                        <!-- Hidden field placed here so as not affect the buttons -->
                        <ww:if test="/canDisableMailNotifications() == false">
                            <ui:component name="'sendBulkNotification'" template="hidden.jsp" theme="'single'" value="'true'" />
                        </ww:if>
                    </page:applyDecorator>
                </ui:param>
            </ui:soy>
        </ui:param>
    </ui:soy>
</body>
</html>

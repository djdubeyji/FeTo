<%@ taglib uri="webwork" prefix="ww" %>
<%@ taglib uri="webwork" prefix="ui" %>
<%@ taglib uri="webwork" prefix="aui" %>
<%@ taglib uri="sitemesh-page" prefix="page" %>
<%@ page import="com.atlassian.jira.component.ComponentAccessor" %>
<%@ page import="com.atlassian.plugin.webresource.WebResourceUrlProvider" %>
<%@ page import="com.atlassian.plugin.webresource.UrlMode" %>
<html>
<head>
	<title><ww:text name="'grouppicker.title'" /></title>
    <script src="<%= ComponentAccessor.getComponent(WebResourceUrlProvider.class).getStaticPluginResourceUrl("jira.webresources:multipickerutils","MultiPickerUtils.js", UrlMode.AUTO) %>"></script>
</head>
<body>
    <ui:soy moduleKey="'jira.webresources:soy-templates'" template="'JIRA.Templates.Headers.pageHeader'">
        <ui:param name="'mainContent'">
            <h1><ww:text name="'grouppicker.title'" /></h1>
        </ui:param>
    </ui:soy>

    <ui:soy moduleKey="'com.atlassian.auiplugin:soy'" template="'aui.page.pagePanel'">
        <ui:param name="'content'">
            <ui:soy moduleKey="'com.atlassian.auiplugin:soy'" template="'aui.page.pagePanelContent'">
                <ui:param name="'tagName'">div</ui:param>
                <ui:param name="'content'">

            <ww:if test="permission == true">
                <page:applyDecorator id="group-picker-popup" name="auiform">
                    <page:param name="action">GroupPickerBrowser.jspa</page:param>
                    <page:param name="method">post</page:param>
                    <page:param name="cssClass">top-label ajs-dirty-warning-exempt</page:param>
                    <page:param name="submitButtonText"><ww:text name="'userpicker.filter'"/></page:param>
                    <ww:property value="filter">
                        <div class="aui-group">
                            <div class="aui-item">
                                <page:applyDecorator name="auifieldgroup">
                                    <aui:textfield label="text('grouppicker.namecontains')" maxlength="255" id="'nameFilter'" name="'nameFilter'" theme="'aui'">
                                        <aui:param name="'cssClass'">full-width-field</aui:param>
                                    </aui:textfield>
                                </page:applyDecorator>
                            </div>
                            <div class="aui-item">
                                <page:applyDecorator name="auifieldgroup">
                                    <aui:select label="text('grouppicker.groupsperpage')" id="'groupsPerPage'" name="'max'" list="/maxValues" listKey="'.'" listValue="'.'" theme="'aui'">
                                        <aui:param name="'cssClass'">full-width-field</aui:param>
                                    </aui:select>
                                </page:applyDecorator>
                            </div>
                        </div>
                        <aui:component template="hidden.jsp" theme="'aui'" name="'element'" />
                        <aui:component template="hidden.jsp" theme="'aui'" name="'multiSelect'" />
                        <aui:component template="hidden.jsp" theme="'aui'" name="'start'" />
                        <aui:component template="hidden.jsp" theme="'aui'" name="'previouslySelected'" />
                    </ww:property>
                </page:applyDecorator>
                <div class="aui-group count-pagination">
                    <div class="results-count aui-item">
                        <ww:text name="'grouppicker.displayinggroups'" value0="niceStart" value1="niceEnd" value2="groups/size" />
                    </div>
                    <div class="pagination aui-item">
                        <jsp:include page="userpicker_navigation.jsp"/>
                    </div>
                </div>
                <ww:if test="/multiSelect == true">
                    <form class="selectorform" name="selectorform" onsubmit="require('jira/multipicker/multipickerutils').addItemsToInputField('input[data-group-select]')">
                        <table class="aui aui-table-rowhover">
                            <thead>
                                <tr>
                                    <th width="1%"><input type="checkbox" name="all" onClick="require('jira/multipicker/multipickerutils').setCheckboxes()" aria-label="<ww:text name="'generic.picker.selectall'"/>"></th>
                                    <th><ww:text name="'grouppicker.groupname'" /></th>
                                </tr>
                            </thead>
                            <tbody>
                            <ww:iterator value="currentPage" status="'status'">
                                <tr data-row-for="<ww:property value="name"/>" title="<ww:text name="'picker.click.to.select'"><ww:param name="'value0'"><ww:property value="name"/></ww:param></ww:text>">
                                    <td><input data-group-select="true" <ww:if test="wasPreviouslySelected(.) == true"> checked="checked"</ww:if> type=checkbox name="userchecks" value="<ww:property value="name"/>" id="group_<ww:property value="@status/index"/>" onclick="require('jira/multipicker/multipickerutils').processCBClick(event, this);"/></td>
                                    <td onclick="require('jira/multipicker/multipickerutils').toggleCheckBox(event, 'group_<ww:property value="@status/index"/>')"><label for="group_<ww:property value="@status/index"/>"><ww:property value="name"/></label></td>
                                </tr>
                            </ww:iterator>
                            </tbody>
                        </table>
                        <div class="buttons-container">
                            <input id="multiselect-submit" class="aui-button" type="submit" value="<ww:text name="'common.words.select'"/>">
                        </div>
                    </form>
                </ww:if>
                <ww:else>
                    <form class="selectorform" name="selectorform" onsubmit="require('jira/multipicker/multipickerutils').selectSingleGroup(event)">
                        <table class="aui aui-table-rowhover">
                            <thead>
                                <tr>
                                    <th width="1%"></th>
                                    <th><ww:text name="'grouppicker.groupname'" /></th>
                                </tr>
                            </thead>
                            <tbody>
                            <ww:iterator value="currentPage" status="'status'">
                                <tr data-row-for="<ww:property value="name"/>" title="<ww:text name="'picker.click.to.select'"><ww:param name="'value0'"><ww:property value="name"/></ww:param></ww:text>" onclick="require('jira/multipicker/multipickerutils').setRadio('group_<ww:property value="@status/index"/>')">
                                    <td><input data-group-select="true" type="radio" name="userchecks" value="<ww:property value="name"/>" id="group_<ww:property value="@status/index"/>"/></td>
                                    <td><label for="group_<ww:property value="@status/index"/>"><ww:property value="name"/></label></td>
                                </tr>
                            </ww:iterator>
                            </tbody>
                        </table>
                        <div class="buttons-container">
                            <input id="singleselect-submit" class="aui-button" type="submit" value="<ww:text name="'common.words.select'"/>">
                        </div>
                    </form>
                </ww:else>
                <ul id="params" style="display:none">
                    <li id="openElement"><ww:property value="$element" /></li>
                </ul>
            </ww:if>
            <ww:else>
                <aui:component template="auimessage.jsp" theme="'aui'">
                    <aui:param name="'messageType'">warning</aui:param>
                    <aui:param name="'messageHtml'">
                        <p><ww:text name="'userpicker.nopermissions'" /></p>
                    </aui:param>
                </aui:component>
            </ww:else>

                </ui:param>
            </ui:soy>
        </ui:param>
    </ui:soy>
</body>
</html>

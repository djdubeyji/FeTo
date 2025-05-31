<%@ taglib uri="webwork" prefix="ww" %>
<%@ taglib uri="webwork" prefix="ui" %>
<%@ taglib uri="webwork" prefix="aui" %>
<%@ taglib uri="sitemesh-page" prefix="page" %>
<%@ page import="com.atlassian.jira.component.ComponentAccessor" %>
<%@ page import="com.atlassian.plugin.webresource.UrlMode" %>
<%@ page import="com.atlassian.plugin.webresource.WebResourceUrlProvider" %>
<html>
<head>
	<title><ww:text name="'userpicker.title'" /></title>
    <style>#search-results{font-size:16px}</style>
    <script src="<%= ComponentAccessor.getComponent(WebResourceUrlProvider.class).getStaticPluginResourceUrl("jira.webresources:multipickerutils","MultiPickerUtils.js", UrlMode.AUTO) %>"></script>
</head>
<body>
    <ui:soy moduleKey="'jira.webresources:soy-templates'" template="'JIRA.Templates.Headers.pageHeader'">
        <ui:param name="'mainContent'">
            <h1><ww:text name="'userpicker.title'" /></h1>
            <p role="status"><ww:text name="'userpicker.displayingusers.brief'" value0="users/size"/></p>
        </ui:param>
    </ui:soy>

    <ui:soy moduleKey="'com.atlassian.auiplugin:soy'" template="'aui.page.pagePanel'">
        <ui:param name="'content'">
            <ui:soy moduleKey="'com.atlassian.auiplugin:soy'" template="'aui.page.pagePanelContent'">
                <ui:param name="'tagName'">div</ui:param>
                <ui:param name="'content'">

            <ww:if test="permission == true">
                <page:applyDecorator id="user-picker-popup" name="auiform">
                    <page:param name="action">UserPickerBrowser.jspa</page:param>
                    <page:param name="method">post</page:param>
                    <page:param name="ariaRole">search</page:param>
                    <page:param name="cssClass">top-label ajs-dirty-warning-exempt</page:param>
                    <page:param name="submitButtonText"><ww:text name="'userpicker.filter'"/></page:param>
                    <ww:property value="filter">
                        <div class="aui-group">
                            <div class="aui-item">
                                <page:applyDecorator name="auifieldgroup">
                                    <aui:textfield label="text('userpicker.fullnamecontains')" maxlength="255" id="'nameFilter'" name="'nameFilter'" theme="'aui'">
                                        <aui:param name="'cssClass'">full-width-field</aui:param>
                                    </aui:textfield>
                                </page:applyDecorator>
                            </div>
                            <div class="aui-item">
                                <ww:if test="/emailColumnVisible == true">
                                    <page:applyDecorator name="auifieldgroup">
                                        <aui:textfield label="text('userpicker.emailcontains')" maxlength="255" id="'emailFilter'" name="'emailFilter'" theme="'aui'">
                                            <aui:param name="'cssClass'">full-width-field</aui:param>
                                        </aui:textfield>
                                    </page:applyDecorator>
                                </ww:if>
                            </div>
                        </div>
                        <div class="aui-group">
                            <div class="aui-item">
                                <page:applyDecorator name="auifieldgroup">
                                    <label for="user-filter-group"><ww:text name="'admin.userbrowser.in.group'"/></label>
                                    <select class="js-default-single-group-picker group-filter" name="group" id="user-filter-group" data-container-class="long-field">
                                        <option data-empty value=""><ww:text name="'common.filters.any'"/></option>
                                        <ww:if test="group">
                                            <option value="<ww:property value="group"/>" selected="selected" data-remove-on-unselect="true"><ww:property value="group"/></option>
                                        </ww:if>
                                    </select>
                                </page:applyDecorator>
                            </div>
                            <div class="aui-item">
                                <page:applyDecorator name="auifieldgroup">
                                    <aui:select label="text('userpicker.usersperpage')" id="'usersPerPage'" name="'max'" list="/maxValues" listKey="'.'" listValue="'.'" theme="'aui'">
                                        <aui:param name="'cssClass'">full-width-field</aui:param>
                                    </aui:select>
                                </page:applyDecorator>
                            </div>
                        </div>
                        <aui:component template="hidden.jsp" theme="'aui'" name="'formName'" />
                        <aui:component template="hidden.jsp" theme="'aui'" name="'element'" />
                        <aui:component template="hidden.jsp" theme="'aui'" name="'multiSelect'" />
                        <aui:component template="hidden.jsp" theme="'aui'" name="'start'" />
                        <aui:component template="hidden.jsp" theme="'aui'" name="'previouslySelected'" />
                        <aui:component template="hidden.jsp" theme="'aui'" name="'triggerEvent'" />
                        <ww:if test="fieldConfigId">
                            <aui:component template="hidden.jsp" theme="'aui'" name="'fieldConfigId'" />
                        </ww:if>
                        <ww:if test="projectIds">
                            <ww:iterator value="projectIds">
                                <aui:component template="hidden.jsp" theme="'aui'" name="'projectId'" value="." />
                            </ww:iterator>
                        </ww:if>
                    </ww:property>
                </page:applyDecorator>
                <ww:if test="/multiSelect == true">
                    <form class="selectorform" name="selectorform" onsubmit="require('jira/multipicker/multipickerutils').selectMultiUser(event)">
                        <div class="aui-group count-pagination">
                            <h2 id="search-results" class="results-count aui-item" role="status">
                                <ww:text name="'userpicker.displayingusers'" value0="niceStart" value1="niceEnd" value2="users/size" />
                            </h2>
                            <div class="pagination aui-item">
                                <jsp:include page="userpicker_navigation.jsp"/>
                            </div>
                        </div>
                        <table class="aui aui-table-rowhover">
                            <thead>
                                <tr>
                                    <th width="1%"><span class="assistive"><ww:text name="'userpicker.table.selection.row.multi'" /></span><input type="checkbox" name="all" onClick="require('jira/multipicker/multipickerutils').setCheckboxes()" aria-label="<ww:text name="'generic.picker.selectall'"/>"></th>
                                    <th><ww:text name="'common.words.username'" /></th>
                                    <th><ww:text name="'common.words.fullname'" /></th>
                                <ww:if test="/emailColumnVisible == true">
                                    <th><ww:text name="'common.words.email'" /></th>
                                </ww:if>
                                </tr>
                            </thead>
                            <tbody>
                            <ww:iterator value="currentPage" status="'status'">
                                <tr data-row-for="<ww:property value="name"/>" id="username_row_<ww:property value="@status/index"/>" title="<ww:text name="'picker.click.to.select'"><ww:param name="'value0'"><ww:property value="displayName"/></ww:param></ww:text>">
                                    <td data-cell-type="user-select"><input data-user-select="true" <ww:if test="wasPreviouslySelected(.) == true">checked="checked"</ww:if> type="checkbox" name="userchecks" value="<ww:property value="name"/>" data-display-name="<ww:property value="displayName"/>" id="user_<ww:property value="@status/index"/>" onclick="require('jira/multipicker/multipickerutils').processCBClick(event, this);"/></td>
                                    <td data-cell-type="name" class="user-name" onclick="require('jira/multipicker/multipickerutils').toggleCheckBox(event, 'user_<ww:property value="@status/index"/>')"><label for="user_<ww:property value="@status/index"/>"><ww:property value="name"/></label></td>
                                    <td data-cell-type="fullname" onclick="require('jira/multipicker/multipickerutils').toggleCheckBox(event, 'user_<ww:property value="@status/index"/>')"><span id="user_fullname_<ww:property value="@status/index"/>"><ww:property value="displayName"/></span></td>
                                    <ww:if test="/emailColumnVisible == true">
                                        <td data-cell-type="email" class="cell-type-email" onclick="require('jira/multipicker/multipickerutils').toggleCheckBox(event, 'user_<ww:property value="@status/index"/>')"><ww:property value="displayEmail(emailAddress)"/></td>
                                    </ww:if>
                                </tr>
                            </ww:iterator>
                            </tbody>
                        </table>
                        <div class="buttons-container">
                            <input id="multiselect-submit" class="aui-button" type="submit" value="<ww:text name="'userpicker.save.selections'"/>">
                        </div>
                    </form>
                </ww:if>
                <ww:else>
                    <form class="selectorform" name="selectorform" onsubmit="require('jira/multipicker/multipickerutils').selectSingleUser(event)">
                        <div class="aui-group count-pagination">
                            <h2 id="search-results" class="results-count aui-item" role="status">
                                <ww:text name="'userpicker.displayingusers'" value0="niceStart" value1="niceEnd" value2="users/size" />
                            </h2>
                            <div class="pagination aui-item">
                                <jsp:include page="userpicker_navigation.jsp"/>
                            </div>
                        </div>
                        <table class="aui aui-table-rowhover">
                            <thead>
                            <tr>
                                <th width="1%"><span class="assistive"><ww:text name="'userpicker.table.selection.row.single'" /></span></th>
                                <th><ww:text name="'common.words.username'" /></th>
                                <th><ww:text name="'common.words.fullname'" /></th>
                                <ww:if test="/emailColumnVisible == true">
                                    <th><ww:text name="'common.words.email'" /></th>
                                </ww:if>
                            </tr>
                            </thead>
                            <tbody>
                            <ww:iterator value="currentPage" status="'status'">
                                <tr data-row-for="<ww:property value="name"/>" id="username_row_<ww:property value="@status/index"/>" title="<ww:text name="'picker.click.to.select'"><ww:param name="'value0'"><ww:property value="displayName"/></ww:param></ww:text>" onclick="setRadio('user_<ww:property value="@status/index"/>')">
                                    <td data-cell-type="user-select"><input data-user-select="true" type="radio" name="userchecks" value="<ww:property value="name"/>" id="user_<ww:property value="@status/index"/>"/></td>
                                    <td data-cell-type="name" class="user-name"><label for="user_<ww:property value="@status/index"/>"><ww:property value="name"/></label></td>
                                    <td data-cell-type="fullname" ><ww:property value="displayName"/></td>
                                    <ww:if test="/emailColumnVisible == true">
                                        <td data-cell-type="email" class="cell-type-email"><ww:property value="displayEmail(emailAddress)"/></td>
                                    </ww:if>
                                </tr>
                            </ww:iterator>
                            </tbody>
                        </table>
                        <div class="buttons-container">
                            <input id="singleselect-submit" class="aui-button" type="submit" value="<ww:text name="'userpicker.save.selections'"/>">
                        </div>
                    </form>
                </ww:else>
                <ul id="params" style="display:none">
                    <li id="openElement"><ww:property value="$element" /></li>
                    <li id="triggerEvent"><ww:property value="$triggerEvent" /></li>
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
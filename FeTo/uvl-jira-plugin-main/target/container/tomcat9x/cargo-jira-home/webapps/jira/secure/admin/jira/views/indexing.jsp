<%@ page import="com.atlassian.plugin.webresource.WebResourceManager" %>
<%@ page import="com.atlassian.jira.component.ComponentAccessor" %>
<%@ taglib uri="webwork" prefix="ww" %>
<%@ taglib uri="webwork" prefix="ui" %>
<%@ taglib uri="webwork" prefix="aui" %>
<%@ taglib uri="sitemesh-page" prefix="page" %>
<ww:bean name="'com.atlassian.jira.util.JiraDateUtils'" id="dateUtils"/>
<html>
<%
    WebResourceManager webResourceManager = ComponentAccessor.getWebResourceManager();
    webResourceManager.requireResourcesForContext("atl.general");
    webResourceManager.requireResourcesForContext("jira.admin.indexing");
%>
<head>
    <title><ww:text name="'admin.indexing.jira.indexing'"/></title>
    <meta name="admin.active.section" content="admin_system_menu/advanced_menu_section/advanced_section"/>
    <meta name="admin.active.tab" content="indexing"/>
</head>
<body>

<page:applyDecorator id="indexing" name="auiform">
    <page:param name="action">IndexReIndex.jspa</page:param>
    <ww:if test="/taskInProgress == true"><page:param name="submitButtonDisabled">true</page:param></ww:if>

    <header class="aui-page-header">
        <div class="aui-page-header-inner">
            <div class="aui-page-header-main">
                <h2><ww:text name="'admin.indexing.reindexing'"/></h2>
            </div>
        </div>
    </header>
    <%-- Message shown when the reindex completes --%>
    <ww:if test="reindexTime > 0">
        <aui:component template="auimessage.jsp" theme="'aui'">
            <aui:param name="'messageType'">success</aui:param>
            <aui:param name="'messageHtml'">
                <p>
                    <ww:text name="'admin.indexing.reindexing.was.successful.server'">
                        <ww:param name="'value0'"><strong></ww:param>
                        <ww:param name="'value1'"></strong></ww:param>
                        <ww:param name="'value2'"><strong><ww:property
                                value="@dateUtils/formatTime(reindexTime)"/></strong></ww:param>
                    </ww:text>
                </p>
            </aui:param>
        </aui:component>
    </ww:if>

    <ww:if test="/indexConsistent == false">
        <aui:component template="auimessage.jsp" theme="'aui'">
            <aui:param name="'messageType'">error</aui:param>
            <aui:param name="'messageHtml'">
                <p><ww:text name="'admin.indexing.strategy.background.unsafe'"/></p>
            </aui:param>
        </aui:component>
    </ww:if>

    <ww:if test="/taskInProgress == true">
        <aui:component template="auimessage.jsp" theme="'aui'">
            <aui:param name="'messageType'">info</aui:param>
            <aui:param name="'messageHtml'">
                <p><ww:property value="/cannotReindexInForegroundMessage"/></p>
            </aui:param>
        </aui:component>
    </ww:if>

    <p>
            <span id="general-description">
                <ww:text name="'admin.indexing.strategy.overview'"/>
                <a href="<ww:property value="/searchIndexingDocsLink"/>" target="_blank" rel="noopener noreferrer">
                    <ww:text name="'admin.indexing.strategy.overview.learn.more'"/>
                </a>
            </span>
    </p>

    <page:applyDecorator name="auifieldset">
        <page:param name="type">group</page:param>
        <page:param name="legend"><ww:text name="'admin.indexing.strategy.options.label'"/></page:param>

        <page:applyDecorator name="auifieldgroup">
            <page:param name="type">radio</page:param>
            <input id="reindex-background" type="radio" class="radio" name="indexingStrategy" value="background"
                   continueInDialog="false" boundAction="IndexReIndex!reindex.jspa"
                   <ww:if test="/taskInProgress == true || /indexConsistent == false">disabled</ww:if>
                   <ww:elseIf test="/indexConsistent == true && /clustered == false">checked</ww:elseIf>
            />
            <label for="reindex-background"><ww:text name="'admin.indexing.strategy.background.label'"/></label>
            <page:param name="description"><ww:text
                    name="'admin.indexing.strategy.background.description'"/></page:param>
        </page:applyDecorator>

        <page:applyDecorator name="auifieldgroup">
            <page:param name="type">radio</page:param>
            <input id="reindex-foreground" type="radio" class="radio" name="indexingStrategy" value="stoptheworld"
                   continueInDialog="true" boundAction="IndexConfirmReIndex!default.jspa"
                   <ww:if test="/taskInProgress == true">disabled</ww:if>
                   <ww:elseIf test="/indexConsistent == false || /clustered == true">checked</ww:elseIf>
            />
            <ww:if test="/clustered == 'true'">
                <label for="reindex-foreground"><ww:text name="'admin.indexing.strategy.dc.foreground.label'"/></label>
                </span><span class="aui-lozenge aui-lozenge-subtle aui-lozenge-success">RECOMMENDED</span>
                <page:param name="description">
                    <p><ww:text name="'admin.indexing.strategy.dc.foreground.description'"/>
                        <br>
                        <ww:text name="'admin.indexing.strategy.dc.foreground.description.unavailability.warning'"/></p>
                </page:param>
            </ww:if>
            <ww:else>
                <label for="reindex-foreground"><ww:text name="'admin.indexing.strategy.foreground.label'"/></label>
                <page:param name="description"><ww:text
                        name="'admin.indexing.strategy.foreground.description'"/></page:param>
            </ww:else>
        </page:applyDecorator>

    </page:applyDecorator>

    <ww:if test="/clustered == 'true'">
        <div class="field-group">
            <label><ww:text name="'admin.indexing.strategy.dc.current.node.label'"/></label>
            <div class="field-value"><span id="current-node"><ww:property value="/currentNodeId"/></span></div>
        </div>
    </ww:if>

    <ww:if test="/hasSystemAdminPermission == true">
        <div class="field-group">
            <label><ww:text name="'setup.indexpath.label'"/></label>
            <div class="field-value"><span id="index-path"><ww:property value="/indexPath"/></span></div>
        </div>
    </ww:if>
    <ww:else>
        <div class="field-group">
            <label><ww:text name="'admin.indexing.search.index.path'"/></label>
            <div class="field-value"><ww:property value="indexPath"/></div>
        </div>
    </ww:else>

    <div class="field-group">
        <div class="field-value">
            <div class="aui-buttons">
                <a id="start-reindex" class="aui-button trigger-dialog" href="IndexConfirmReIndex!default.jspa">
                    <ww:text name="'admin.indexing.reindex'"/>
                </a>
            </div>
        </div>
    </div>
</page:applyDecorator>
<ww:if test="/hasSystemAdminPermission == true">
    <hr/>
    <page:applyDecorator id="index-recovery" name="auiform">
        <page:param name="action">IndexRecover.jspa</page:param>
        <page:param name="submitButtonText"><ww:text name="'admin.index.recovery.perform'"/></page:param>
        <page:param name="submitButtonName">index-recover</page:param>

        <header class="aui-page-header">
            <div class="aui-page-header-inner">
                <div class="aui-page-header-main">
                    <h2><ww:text name="'admin.index.recovery.heading'"/></h2>
                </div>
            </div>
        </header>

        <h3><ww:text name="'admin.index.status.heading'"/></h3>
        <table class="aui aui-table-rowhover" id="table-IndexSnapshotStatus">
            <tbody>
            <tr>
                <td width="40%" data-cell-type="label">
                    <strong><ww:text name="'admin.index.status.progress'"/></strong>
                </td>
                <td width="60%" data-cell-type="value" id="snapshot-generation-status">
                    <ww:text name="'common.concepts.loading'"/>
                </td>
            </tr>
            <tr>
                <td width="40%" data-cell-type="label">
                    <strong><ww:text name="'admin.index.status.name'"/></strong>
                </td>
                <td width="60%" data-cell-type="value" id="last-index-snapshot-name">
                    <ww:text name="'common.concepts.loading'"/>
                </td>
            </tr>
            <tr>
                <td width="40%" data-cell-type="label">
                    <strong><ww:text name="'admin.index.status.date'"/></strong>
                </td>
                <td width="60%" data-cell-type="value" id="last-index-snapshot-date">
                    <ww:text name="'common.concepts.loading'"/>
                </td>
            </tr>
            </tbody>
        </table>

        <h3><ww:text name="'admin.index.create.heading'"/></h3>
        <p>
            <ww:text name="'admin.index.create.description'"/>
        </p>
        <p>
            <input class="aui-button" disabled type="button" id="create-index-snapshot" value="<ww:text name="'admin.index.create.button'"/>"/>
            <span id="create-index-snapshot-in-progress-message" hidden><ww:text name="'admin.index.status.in.progress'"/></span>
        </p>
        <div class="aui-page-header-inner">
            <div class="aui-page-header-main">
                <h3><ww:text name="'admin.index.create.scheduled'"/></h3>
            </div>
            <div class="aui-page-header-actions">
                <div class="aui-buttons">
                    <a id="edit-recovery-settings" class="aui-button trigger-dialog"
                       href="EditIndexRecoverySettings!default.jspa">
                        <span class="aui-icon aui-icon-small aui-iconfont-edit"></span>
                        <ww:text name="'admin.common.phrases.edit.settings'"/>
                    </a>
                </div>
                <aui:component name="'indexrecovery'" template="help.jsp" theme="'aui'"/>
            </div>
        </div>
        <table class="aui aui-table-rowhover" id="table-AttachmentSettings">
            <tbody>
            <tr data-attachment-setting="allow-attachment">
                <td width="40%" data-cell-type="label">
                    <strong><ww:text name="'admin.index.recovery.enable'"/></strong>
                </td>
                <td width="60%" data-cell-type="value" id="index-recovery-enablement-status">
                    <ww:if test="recoveryEnabled == 'true'">
                        <strong class="status-active"><ww:text name="'admin.common.words.on'"/></strong>
                    </ww:if>
                    <ww:else>
                        <strong class="status-inactive"><ww:text name="'admin.common.words.off'"/></strong>
                    </ww:else>
                </td>
            </tr>
            <tr>
                <td data-cell-type="label">
                    <strong><ww:text name="'admin.index.recovery.snapshot.directory'"/></strong>
                    <div class="secondary-text">
                        <ww:text name="'admin.index.recovery.snapshot.directory.description'"/>
                    </div>
                </td>
                <td data-cell-type="value">
                    <ww:property value="snapshotDirectory"/>
                </td>
            </tr>
            <ww:if test="recoveryEnabled == 'true'">
                <tr>
                    <td width="40%" data-cell-type="label">
                        <strong><ww:text name="'admin.index.recovery.snapshot.schedule'"/></strong>
                    </td>
                    <td width="60%" data-cell-type="value" id="index-recovery-snapshot-time">
                        <ww:property value="snapshotCronExpression"/>
                    </td>
                </tr>
            </ww:if>
            </tbody>
        </table>

        <h3><ww:text name="'admin.index.recovery.file.heading'"/></h3>
        <aui:component template="auimessage.jsp" theme="'aui'">
            <aui:param name="'messageType'">info</aui:param>
            <aui:param name="'messageHtml'">
                <ww:text name="'admin.index.recovery.warning'"/><br/>
                <ww:text name="'admin.index.recovery.warning.2'"/><br/>
            </aui:param>
        </aui:component>
        <page:applyDecorator name="auifieldset">
            <page:applyDecorator name="auifieldset">
                <page:applyDecorator name="auifieldgroup">
                    <page:param name="description"><ww:text name="'admin.index.recovery.file.name.description'"/>
                    </page:param>
                    <aui:textfield id="'file-name'" size="'long'" label="text('admin.index.recovery.file.name')"
                                   name="'recoveryFilename'" theme="'aui'"/>
                </page:applyDecorator>
            </page:applyDecorator>
        </page:applyDecorator>
    </page:applyDecorator>
</ww:if>
<ww:if test="/hasSystemAdminPermission == true && /clustered == true">
    <hr/>
    <page:applyDecorator id="index-cluster-copy" name="auiform">
        <page:param name="action">IndexCopy.jspa</page:param>
        <page:param name="submitButtonText"><ww:text name="'admin.index.copy.perform'"/></page:param>
        <page:param name="submitButtonName">index-copy</page:param>
        <ww:if test="/taskInProgress == true"><page:param name="submitButtonDisabled">true</page:param></ww:if>

        <header class="aui-page-header">
            <div class="aui-page-header-inner">
                <div class="aui-page-header-main">
                    <h2><ww:text name="'admin.index.copy.heading'"/></h2>
                </div>
            </div>
        </header>
        <ww:if test="copyRequested == true">
            <aui:component template="auimessage.jsp" theme="'aui'">
                <aui:param name="'messageType'">success</aui:param>
                <aui:param name="'messageHtml'">
                    <p>
                        <ww:text name="'admin.index.copy.requested'">
                            <ww:param name="'value0'"><ww:property value="copyFromNodeId"/></ww:param>
                            <ww:param name="'value1'"><ww:property value="currentNodeId"/></ww:param>
                            <ww:param name="'value2'"><strong><ww:property
                                    value="@dateUtils/formatTime(reindexTime)"/></strong></ww:param>
                        </ww:text>
                    </p>
                </aui:param>
            </aui:component>
        </ww:if>
        <aui:component template="auimessage.jsp" theme="'aui'">
            <aui:param name="'messageType'">info</aui:param>
            <aui:param name="'messageHtml'">
                <ww:text name="'admin.index.copy.warning'"/><br/>
                <ww:text name="'admin.index.copy.warning.2'"/><br/>
            </aui:param>
        </aui:component>
        <page:applyDecorator name="auifieldset">
            <page:applyDecorator name="auifieldset">
                <page:applyDecorator name="auifieldgroup">
                    <page:param name="description"><ww:text
                            name="'admin.index.copy.from.node.description'"/></page:param>
                    <ui:select label="text('admin.index.copy.from.node')" name="'copyFromNodeId'" size="'medium'"
                               list="nodeList" listKey="'nodeId'" listValue="'nodeId'" value="nodeId" theme="'aui'"/>
                </page:applyDecorator>
                <page:applyDecorator name="auifieldgroup">
                    <page:param name="description"><ww:text name="'admin.index.copy.to.node.description'"/></page:param>
                    <ui:textfield label="text('admin.index.copy.to.node')" name="'copyToNodeId'" size="'medium'"
                                  readonly="true" value="./currentNodeId" theme="'aui'"/>
                </page:applyDecorator>
            </page:applyDecorator>
        </page:applyDecorator>
    </page:applyDecorator>
</ww:if>
</body>
</html>

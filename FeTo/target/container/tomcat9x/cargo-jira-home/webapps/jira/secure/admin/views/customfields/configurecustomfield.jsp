<%@ taglib uri="webwork" prefix="ww" %>
<%@ taglib uri="webwork" prefix="ui" %>
<%@ taglib uri="sitemesh-page" prefix="page" %>
<html>
<head>
    <meta name="admin.active.section" content="admin_issues_menu/element_options_section/fields_section"/>
    <meta name="admin.active.tab" content="view_custom_fields"/>
	<title><ww:text name="'admin.issuefields.customfields.configure.custom.field'">
	    <ww:param name="'value0'"><ww:property value="/field/name" /></ww:param>
	</ww:text></title>
</head>
<body>
<style type="text/css">
<!--
.fieldLabelArea
{
    width: 30%;
}
-->
</style>
<ww:if test="isUiLegacy == true">
	<page:applyDecorator name="jirapanel">
		<page:param name="title">
            <ww:text name="'admin.issuefields.customfields.configure.custom.field'">
	            <ww:param name="'value0'"><ww:property value="/field/name" /></ww:param>
	        </ww:text>
            <ww:if test='/fieldConfigureAvailable == false'>
                <span class="aui-lozenge aui-lozenge-subtle" title="<ww:text name="/managedFieldDescriptionKey"/>"><ww:text name="'admin.managed.configuration.items.locked'"/></span>
            </ww:if>
            <ww:elseIf test='/fieldManaged == true'>
                <span class="aui-lozenge aui-lozenge-subtle" title="<ww:text name="/managedFieldDescriptionKey"/>"><ww:text name="'admin.managed.configuration.items.managed'"/></span>
            </ww:elseIf>
        </page:param>
		<page:param name="instructions">
        <p>
            <ww:text name="'admin.issuefields.customfields.configure.description'"/>
            <a href="<ww:property value="/documentationUrl/url"/>"><ww:text name="'admin.issuefields.customfields.configure.description.learn.more.link'"/></a>
        </p>
        <ul class="square">
            <ww:if test='/fieldConfigureAvailable == true'>
                <li><a id="add_new_context" title="<ww:text name="'admin.issuefields.customfields.add.new.context'"/>" href="<ww:url value="'ManageConfigurationScheme!default.jspa'"><ww:param name="'fieldId'" value="/fieldId" /><ww:param name="'returnUrl'">ConfigureCustomField!default.jspa?fieldId=<ww:property value="/fieldId" /></ww:param></ww:url>"><ww:text name="'admin.issuefields.customfields.add.new.context'"/></a></li>
            </ww:if>
            <li><a title="<ww:text name="'admin.issuefields.customfields.view.custom.fields'"/>" href="<ww:url value="'ViewCustomFields.jspa'"></ww:url>"><ww:text name="'admin.issuefields.customfields.view.custom.fields'"/></a></li>
        </ul>
        </page:param>
        <page:param name="helpURL">configcustomfield</page:param>
		<page:param name="width">100%</page:param>
        <ww:iterator value="/configs" status="'status'">
        <ww:if test="id == /fieldConfigSchemeId">
            <div class="highlighted">
        </ww:if>
        <page:applyDecorator name="jiraform">
            <page:param name="width">100%</page:param>
            <page:param name="pretitle">
                <ww:if test='/fieldConfigureAvailable == true'>
                    <div class="toolbar">
                        <a id="edit_<ww:property value="id" />" href="<ww:url page="/secure/admin/ManageConfigurationScheme!default.jspa"><ww:param name="'fieldId'" value="/fieldId"/><ww:param name="'fieldConfigSchemeId'" value="./id" /></ww:url>" title="<ww:text name="'admin.issuefields.customfields.edit.scheme'"/>"><span class="icon-default aui-icon aui-icon-small aui-iconfont-configure"></span></a>
                        <a id="delete_<ww:property value="id" />" class="trigger-dialog" href="<ww:url page="/secure/admin/ConfigureCustomField!delete.jspa?"><ww:param name="'fieldId'" value="/fieldId"/><ww:param name="'fieldConfigSchemeId'" value="./id" /></ww:url>" title="<ww:text name="'admin.issuefields.customfields.delete.scheme'"/>"><span class="icon-default aui-icon aui-icon-small aui-iconfont-delete"></span></a>
                    </div>
                </ww:if>
            </page:param>
            <page:param name="title"><ww:property value="name" /></page:param>
            <page:param name="jiraformId">configscheme<ww:property value="id" /></page:param>
            <page:param name="instructions"><ww:property value="description" ><ww:if test="."><ww:property value="." /></ww:if></ww:property></page:param>

            <tr>
                <td class="fieldLabelArea">
                    <ww:text name="'admin.issuefields.customfields.applicable.contexts'"/>
                </td>
                <td class="fieldValueArea">
                    <ww:if test='/fieldConfigureAvailable == true'>
                        <a class="config actionLinks subText" href="<ww:url value="'ManageConfigurationScheme!default.jspa'"><ww:param name="'fieldConfigSchemeId'" value="id" /><ww:param name="'fieldId'" value="/fieldId" /><ww:param name="'returnUrl'">ConfigureCustomField!default.jspa?fieldId=<ww:property value="/fieldId" /></ww:param></ww:url>" title="<ww:text name="'common.words.edit'"/>"><ww:text name="'admin.common.phrases.edit.configuration'"/></a>
                    </ww:if>

                   <jsp:include page="contexts.jsp" flush="true"/>
                </td>
            </tr>

            <ww:if test="./basicMode == true">
                <ww:iterator value="./configsByConfig" status="'status'">

                <ww:iterator value="./key/configItems" status="'rowStatus'">
                <tr>
                    <td class="fieldLabelArea"><ww:text name="displayNameKey" />:</td>
                    <td class="fieldValueArea" id="<ww:property value="/fieldId"/>-value-<ww:property value="objectKey"/>">
                        <ww:property value="viewHtml(null)" escape="false" />
                        <ww:if test="baseEditUrl && /fieldConfigureAvailable == true"><a id="<ww:property value="/fieldId"/>-edit-<ww:property value="objectKey"/>" class="actionLinks subText" href="<ww:url value="baseEditUrl"><ww:param name="'fieldConfigSchemeId'" value="../id" /><ww:param name="'fieldConfigId'" value="../key/id" /><ww:param name="'returnUrl'">ConfigureCustomField!default.jspa?fieldId=<ww:property value="/fieldId" /></ww:param></ww:url>">
                            <ww:text name="'admin.customfields.edit.value'"><ww:param name="'value0'"><ww:text name="displayNameKey" /></ww:param></ww:text></a>
                        </ww:if>
                    </td>
                </tr>
                </ww:iterator>
                </ww:iterator>

            </ww:if>
        </page:applyDecorator>
        <ww:if test="id == /fieldConfigSchemeId">
            </div>
        </ww:if>
        </ww:iterator>
    </page:applyDecorator>
</ww:if>
<ww:else>
    <custom-field-configure-panel data-field-id="<ww:property value="fieldId"/>">
        <ww:iterator value="/configs" status="'status'">
            <ww:iterator value="./configsByConfig" status="'status'">
                <ww:iterator value="./key/configItems" status="'rowStatus'">
                    <div data-context-scheme-id="<ww:property value="../id"/>" data-context-scheme-configuration-title="<ww:text name="displayNameKey"/>" style="display: none;">
                        <ww:property value="viewHtml(null)" escape="false" />
                        <ww:if test="baseEditUrl && /fieldConfigureAvailable == true"><a id="<ww:property value="/fieldId"/>-edit-<ww:property value="objectKey"/>" class="actionLinks subText" href="<ww:url value="baseEditUrl"><ww:param name="'fieldConfigSchemeId'" value="../id" /><ww:param name="'fieldConfigId'" value="../key/id" /><ww:param name="'returnUrl'">ConfigureCustomField!default.jspa?fieldId=<ww:property value="/fieldId" /></ww:param></ww:url>">
                            <ww:text name="'admin.customfields.edit.value'"><ww:param name="'value0'"><ww:text name="displayNameKey" /></ww:param></ww:text></a>
                        </ww:if>
                    </div>
                </ww:iterator>
            </ww:iterator>
        </ww:iterator>
    </custom-field-configure-panel>
</ww:else>
</body>
</html>

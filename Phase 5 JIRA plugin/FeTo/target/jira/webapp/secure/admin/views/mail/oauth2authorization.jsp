<%@ taglib prefix="ww" uri="webwork" %>
<%@ taglib prefix="aui" uri="webwork" %>
<%@ taglib prefix="page" uri="sitemesh-page" %>
<div class="form-body">
    <aui:component id="'oauth2Authorization'" template="auimessage.jsp" theme="'aui'">
        <aui:param name="'messageType'">info</aui:param>
        <aui:param name="'messageHtml'"><p><ww:text name="'admin.mailserver.authorize.flow'" /></p></aui:param>
    </aui:component>
    <div id="oauth2AuthorizationMessages">
        <ww:if test="/actionName == 'PerformOAuth2Authorization'" >
            <ww:if test="/hasAnyErrors == false">
                <aui:component template="auimessage.jsp" theme="'aui'">
                    <aui:param name="'messageType'">success</aui:param>
                    <aui:param name="'messageHtml'">
                        <p><ww:text name="'admin.mailserver.authorize.sucess'"/></p>
                    </aui:param>
                </aui:component>
            </ww:if>
            <ww:else>
                <ww:if test="/hasErrorMessages == true && /hasErrors==false">
                    <aui:component template="auimessage.jsp" theme="'aui'">
                        <aui:param name="'messageType'">error</aui:param>
                        <aui:param name="'messageHtml'">
                            <p><ww:text name="'admin.mailserver.authorize.failure'"/></p>
                            <ul>
                                <ww:iterator id="error" value="/errorMessages">
                                    <li><ww:property value="."/></li>
                                </ww:iterator>
                            </ul>
                        </aui:param>
                    </aui:component>
                </ww:if>
            </ww:else>
        </ww:if>
    </div>
</div>

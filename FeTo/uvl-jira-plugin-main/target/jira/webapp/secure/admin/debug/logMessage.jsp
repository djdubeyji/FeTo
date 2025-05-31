<%@ page import="org.apache.log4j.Logger" %>
<%@ page import="org.apache.commons.lang3.StringUtils" %>
<%@ page import="com.opensymphony.util.TextUtils" %>
<%@ page import="javax.servlet.http.HttpServletRequest" %>
<%@ page import="javax.servlet.http.HttpServletResponse" %>
<%@ page import="com.atlassian.jira.component.ComponentAccessor" %>
<%@ page import="com.atlassian.jira.security.xsrf.XsrfInvocationChecker" %>
<%@ page import="com.atlassian.jira.security.xsrf.XsrfCheckResult" %>
<%@ page import="com.atlassian.jira.security.xsrf.XsrfTokenGenerator" %>

<%
   XsrfTokenGenerator xsrfTokenGenerator = ComponentAccessor.getComponentOfType(XsrfTokenGenerator.class);
   String atl_token = xsrfTokenGenerator.generateToken(request);
%>

<%! public static final Logger log = Logger.getLogger("logMessage.jsp"); %>

<html>
<head>
    <title> Logs a Message to the atlassian-jira.log</title>
</head>
<body>
<p>
<%
    String message = request.getParameter("message");
    if(request.getMethod().equals("POST")) {
           XsrfInvocationChecker invocationChecker = ComponentAccessor.getComponentOfType(XsrfInvocationChecker.class);
           final XsrfCheckResult result = invocationChecker.checkWebRequestInvocation(request);
           if (result.isValid() && !StringUtils.isBlank(message)) {
               log.info(message);
%>
                   <b>message logged:</b> <%= TextUtils.htmlEncode(message) %>
<%
           } else {
               response.sendError(HttpServletResponse.SC_FORBIDDEN);
           }
       }
%>
</p>
<p>
    <b>Log a message:</b>
    <form action="logMessage.jsp" method="POST">
        <input type="hidden" name="atl_token" value="<%=atl_token%>"/>
        <input type="text" name="message" size="80" value="<%=TextUtils.htmlEncode(message)%>"/>
        <input type="reset" value="clear"/>
        <input type="submit" name="log" value="log"/>
    </form>
</p>
</body>
</html>
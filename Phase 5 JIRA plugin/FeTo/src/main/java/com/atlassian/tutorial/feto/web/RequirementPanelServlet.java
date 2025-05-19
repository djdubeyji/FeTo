package com.atlassian.tutorial.feto.web;

import com.atlassian.jira.project.ProjectManager;
import com.atlassian.plugin.webresource.WebResourceManager;
import com.atlassian.templaterenderer.TemplateRenderer;
import com.atlassian.tutorial.feto.api.MyPluginComponent;
import com.atlassian.tutorial.feto.model.TopicWithFeedback;

import javax.inject.Inject;
import javax.inject.Named;
import javax.servlet.http.*;
import java.io.IOException;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@Named
public class RequirementPanelServlet extends HttpServlet {

    private final TemplateRenderer renderer;
    private final MyPluginComponent myPluginComponent;
    private final WebResourceManager webResourceManager;

    @Inject
    public RequirementPanelServlet(TemplateRenderer renderer, MyPluginComponent myPluginComponent, WebResourceManager webResourceManager) {
        this.renderer = renderer;
        this.myPluginComponent = myPluginComponent;
        this.webResourceManager = webResourceManager;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String requirementId = req.getParameter("requirementId");
        Map<String, Object> context = new HashMap<>();

        List<TopicWithFeedback> topicList = myPluginComponent.getTopicsWithFeedback(requirementId);
        context.put("topics", topicList);
        context.put("requirementId", requirementId);

        webResourceManager.requireResource("com.atlassian.auiplugin:aui-experimental-tooltips");
        resp.setContentType("text/html;charset=utf-8");
        renderer.render("templates/requirement-panel.vm", context, resp.getWriter());
        renderer.render("templates/feto-tab.vm", context, resp.getWriter());

    }
}

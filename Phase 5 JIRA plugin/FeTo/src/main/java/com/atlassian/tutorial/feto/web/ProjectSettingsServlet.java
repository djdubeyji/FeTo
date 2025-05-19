package com.atlassian.tutorial.feto.web;

import com.atlassian.templaterenderer.TemplateRenderer;
import com.atlassian.jira.project.Project;
import com.atlassian.jira.project.ProjectManager;
import com.atlassian.jira.user.util.UserManager;
import com.atlassian.plugins.rest.common.security.AnonymousAllowed;
import com.atlassian.soy.renderer.SoyTemplateRenderer;
import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.FileItemFactory;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import com.atlassian.tutorial.feto.api.MyPluginComponent;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import java.io.*;
import java.util.List;
import javax.inject.Inject;

@WebServlet("/projects/settings")
public class ProjectSettingsServlet extends HttpServlet {

    private final TemplateRenderer renderer;
    private final ProjectManager projectManager;
    private final UserManager userManager;
    private final MyPluginComponent myPluginComponent;

    @Inject
    public ProjectSettingsServlet(TemplateRenderer renderer, ProjectManager projectManager, UserManager userManager, MyPluginComponent myPluginComponent) {
        this.renderer = renderer;
        this.projectManager = projectManager;
        this.userManager = userManager;
        this.myPluginComponent = myPluginComponent;
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String projectKey = req.getParameter("projectKey");

        try {
            FileItemFactory factory = new DiskFileItemFactory();
            ServletFileUpload upload = new ServletFileUpload(factory);
            List<FileItem> items = upload.parseRequest(req);

            String enabledFlag = "false";
            FileItem topicsFile = null;
            FileItem feedbackFile = null;

            for (FileItem item : items) {
                if (item.isFormField()) {
                    if (item.getFieldName().equals("enabled")) {
                        enabledFlag = item.getString(); // You can store this in DB
                    }
                } else {
                    if (item.getFieldName().equals("topicsFile")) {
                        topicsFile = item;
                    }
                    if (item.getFieldName().equals("feedbackFile")) {
                        feedbackFile = item;
                    }
                }
            }

            if (topicsFile != null) {
                try (InputStream is = topicsFile.getInputStream();
                     Reader reader = new InputStreamReader(is)) {
                    Iterable<CSVRecord> records = CSVFormat.DEFAULT.withFirstRecordAsHeader().parse(reader);
                    for (CSVRecord record : records) {
                        String requirementId = record.get("requirement_id");
                        String topic = record.get("topic");
                        myPluginComponent.saveTopic(requirementId, topic);
                    }
                }
            }

            if (feedbackFile != null) {
                try (InputStream is = feedbackFile.getInputStream();
                     Reader reader = new InputStreamReader(is)) {
                    Iterable<CSVRecord> records = CSVFormat.DEFAULT.withFirstRecordAsHeader().parse(reader);
                    for (CSVRecord record : records) {
                        String requirementId = record.get("requirement_id");
                        String topic = record.get("topic");
                        String feedback = record.get("feedback_text");
                        myPluginComponent.saveFeedback(requirementId, topic, feedback);
                    }
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        resp.sendRedirect(req.getRequestURI() + "?projectKey=" + projectKey);
    }
}

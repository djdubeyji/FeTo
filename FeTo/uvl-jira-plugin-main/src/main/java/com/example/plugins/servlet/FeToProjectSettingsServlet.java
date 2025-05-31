package com.example.plugins.servlet;

import javax.servlet.ServletException;
import javax.servlet.http.*;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.*;
import org.apache.commons.fileupload.*;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;

public class FeToProjectSettingsServlet extends HttpServlet {
    private void storeProjectPropertyInJira(String projectKey, String propertyKey, String jsonBody) throws Exception {
        String apiUrl = "http://localhost:2990/jira/rest/api/2/project/" + projectKey + "/properties/" + propertyKey;
        HttpURLConnection connection = (HttpURLConnection) new URL(apiUrl).openConnection();
        connection.setRequestMethod("PUT");
        connection.setRequestProperty("Authorization", "Basic " + getEncodedCredentials());
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setDoOutput(true);

        try (OutputStream os = connection.getOutputStream()) {
            os.write(jsonBody.getBytes());
            os.flush();
        }
        int responseCode = connection.getResponseCode();
        if (responseCode != 201 && responseCode != 204) {
            throw new IOException("Failed to store property for project: " + projectKey + ". HTTP Code: " + responseCode);
        }
    }

    private String getEncodedCredentials() {
        String credentials = "admin:admin"; // Replace with secure fetch in production
        return java.util.Base64.getEncoder().encodeToString(credentials.getBytes());
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException, ServletException {
        resp.setContentType("text/html");
        try (InputStream in = getClass().getResourceAsStream("/templates/feto-project-settings.html");
             BufferedReader reader = new BufferedReader(new InputStreamReader(in));
             PrintWriter out = resp.getWriter()) {
            String line;
            while ((line = reader.readLine()) != null) {
                out.println(line);
            }
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException, ServletException {
        if (!ServletFileUpload.isMultipartContent(req)) {
            resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Form must have enctype=multipart/form-data.");
            return;
        }

        String projectKey = null;
        boolean fetoEnabled = false;
        String topicsContent = null;
        String feedbackContent = null;

        try {
            DiskFileItemFactory factory = new DiskFileItemFactory();
            ServletFileUpload upload = new ServletFileUpload(factory);
            List<FileItem> items = upload.parseRequest(req);

            for (FileItem item : items) {
                if (item.isFormField()) {
                    if ("projectKey".equals(item.getFieldName())) {
                        projectKey = item.getString("UTF-8");
                    } else if ("fetoEnabled".equals(item.getFieldName())) {
                        fetoEnabled = true;
                    }
                } else if ("topicsFile".equals(item.getFieldName())) {
                    topicsContent = new BufferedReader(new InputStreamReader(item.getInputStream()))
                            .lines().collect(java.util.stream.Collectors.joining("\n"));
                } else if ("feedbackFile".equals(item.getFieldName())) {
                    feedbackContent = new BufferedReader(new InputStreamReader(item.getInputStream()))
                            .lines().collect(java.util.stream.Collectors.joining("\n"));
                }
            }

            if (projectKey == null) {
                resp.sendError(HttpServletResponse.SC_BAD_REQUEST, "Missing projectKey");
                return;
            }

            storeProjectPropertyInJira(projectKey, "feto_enabled", "{\"enabled\": " + fetoEnabled + "}");
            if (topicsContent != null) {
                storeProjectPropertyInJira(projectKey, "topics_dataset", topicsContent);
            }
            if (feedbackContent != null) {
                storeProjectPropertyInJira(projectKey, "feedback_dataset", feedbackContent);
            }

            resp.sendRedirect(req.getRequestURI() + "?success=true");
        } catch (Exception e) {
            resp.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error storing settings: " + e.getMessage());
        }
    }
}
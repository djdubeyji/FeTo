package com.atlassian.tutorial.feto.impl;

import com.atlassian.plugin.spring.scanner.annotation.export.ExportAsService;
import com.atlassian.plugin.spring.scanner.annotation.imports.ComponentImport;
import com.atlassian.sal.api.ApplicationProperties;
import com.atlassian.tutorial.feto.api.MyPluginComponent;
import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.tutorial.feto.model.TopicEntity;
import com.atlassian.tutorial.feto.model.FeedbackEntity;
import com.atlassian.tutorial.feto.model.TopicWithFeedback;
import com.atlassian.tutorial.feto.support.QueryDslSupport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.inject.Inject;
import javax.inject.Named;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import net.java.ao.Query;
import java.util.Arrays;

@ExportAsService ({MyPluginComponent.class})
@Named ("myPluginComponent")
public class MyPluginComponentImpl implements MyPluginComponent {

    private static final Logger log = LoggerFactory.getLogger(MyPluginComponentImpl.class);
    private final ActiveObjects ao;
    private final QueryDslSupport queryDslSupport;
    private final ApplicationProperties applicationProperties;

    @Inject
    public MyPluginComponentImpl(ActiveObjects ao, QueryDslSupport queryDslSupport, ApplicationProperties applicationProperties) {
        this.ao = ao;
        this.queryDslSupport = queryDslSupport;
        this.applicationProperties = applicationProperties;
    }
    @Override
    public String getName() {
        if (null != applicationProperties) {
            return "myComponent:" + applicationProperties.getDisplayName();
    }

    return "myComponent";
}
    @Override
    public void saveTopic(String requirementId, String topic) {
        String sql = "INSERT INTO feto_topic (requirement_id, topic) VALUES (?, ?)";
        try (Connection conn = queryDslSupport.getDatabaseConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, requirementId);
            ps.setString(2, topic);
            ps.executeUpdate();
        } catch (SQLException e) {
            log.error("Failed to insert topic", e);
        }
    }

    @Override
    public void saveFeedback(String requirementId, String topic, String feedback) {
        String sql = "INSERT INTO feto_feedback (requirement_id, topic, feedback_text) VALUES (?, ?, ?)";
        try (Connection conn = queryDslSupport.getDatabaseConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, requirementId);
            ps.setString(2, topic);
            ps.setString(3, feedback);
            ps.executeUpdate();
        } catch (SQLException e) {
            log.error("Failed to insert feedback", e);
        }
    }

    @Override
    public List<TopicWithFeedback> getTopicsWithFeedback(String requirementId) {
        Map<String, List<String>> topicMap = new HashMap<>();
        String sql = "SELECT topic, feedback_text FROM feto_feedback WHERE requirement_id = ?";

        try (Connection conn = queryDslSupport.getDatabaseConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, requirementId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String topic = rs.getString("topic");
                    String feedback = rs.getString("feedback_text");
                    topicMap.computeIfAbsent(topic, k -> new ArrayList<>()).add(feedback);
                }
            }
        } catch (SQLException e) {
            log.error("Failed to fetch feedback per topic", e);
        }

        return topicMap.entrySet().stream()
                .map(entry -> new TopicWithFeedback(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());
    }

    @Override
    public List<TopicEntity> getTopicsForRequirement(String requirementId) {
        TopicEntity[] topics = ao.find(TopicEntity.class, Query.select().where("REQUIREMENT_ID = ?", requirementId));
        return Arrays.asList(topics); 
    }

    @Override
    public List<FeedbackEntity> getFeedbackForTopic(String requirementId, String topic) {
        FeedbackEntity[] feedbackEntities = ao.find(FeedbackEntity.class, Query.select().where("REQUIREMENT_ID = ? AND TOPIC = ?", requirementId, topic));
        return Arrays.asList(feedbackEntities); 
    }
}

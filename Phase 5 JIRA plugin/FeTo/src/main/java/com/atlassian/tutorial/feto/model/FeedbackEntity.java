package com.atlassian.tutorial.feto.model;

import net.java.ao.Entity;
import net.java.ao.Preload;

@Preload
public interface FeedbackEntity extends Entity {

    String getRequirementId();
    void setRequirementId(String requirementId);

    String getTopic();
    void setTopic(String topic);

    String getFeedbackText();
    void setFeedbackText(String feedbackText);
}

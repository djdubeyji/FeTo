package com.atlassian.tutorial.feto.api;
import com.atlassian.tutorial.feto.model.TopicEntity;
import com.atlassian.tutorial.feto.model.FeedbackEntity;
import com.atlassian.tutorial.feto.model.TopicWithFeedback;
import java.util.List;

public interface MyPluginComponent {
    void saveTopic(String requirementId, String topic);
    void saveFeedback(String requirementId, String topic, String feedbackText);
    List<TopicEntity> getTopicsForRequirement(String requirementId);
    List<FeedbackEntity> getFeedbackForTopic(String requirementId, String topic);
    List<TopicWithFeedback> getTopicsWithFeedback(String requirementId);
    String getName();

}

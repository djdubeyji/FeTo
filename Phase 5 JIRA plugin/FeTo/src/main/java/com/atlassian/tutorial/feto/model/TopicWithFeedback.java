package com.atlassian.tutorial.feto.model;

import java.util.List;

public class TopicWithFeedback {
    private String topic;
    private List<String> feedbackList;

    public TopicWithFeedback(String topic, List<String> feedbackList) {
        this.topic = topic;
        this.feedbackList = feedbackList;
    }

    public String getTopic() {
        return topic;
    }

    public List<String> getFeedbackList() {
        return feedbackList;
    }
}

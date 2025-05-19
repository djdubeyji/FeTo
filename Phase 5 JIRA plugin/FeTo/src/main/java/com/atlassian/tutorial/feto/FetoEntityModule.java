package com.atlassian.tutorial.feto;

import com.atlassian.activeobjects.external.ActiveObjects;
import com.atlassian.tutorial.feto.model.FeedbackEntity;
import com.atlassian.tutorial.feto.model.TopicEntity;
import net.java.ao.EntityManager;
import net.java.ao.SchemaConfiguration;
import net.java.ao.schema.TableNameConverter;

import javax.inject.Inject;
import javax.inject.Named;
import javax.annotation.PostConstruct;

@Named
public class FetoEntityModule {

    private final ActiveObjects ao;

    @Inject
    public FetoEntityModule(ActiveObjects ao) {
        this.ao = ao;
    }

    @PostConstruct
    public void init() {
        ao.migrate(TopicEntity.class, FeedbackEntity.class);
    }
}

package com.atlassian.tutorial.feto.support;

import com.querydsl.jpa.impl.JPAQueryFactory;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import java.sql.Connection;

public class QueryDslSupport {

    @PersistenceContext
    private EntityManager entityManager;

    // Method to get JPAQueryFactory instance
    public JPAQueryFactory getQueryFactory() {
        return new JPAQueryFactory(entityManager);
    }

    // Method to get a database connection (if required)
    public Connection getDatabaseConnection() {
        try {
            return entityManager.unwrap(java.sql.Connection.class);
        } catch (Exception e) {
            // Handle exception
            throw new RuntimeException("Failed to get database connection", e);
        }
    }
}

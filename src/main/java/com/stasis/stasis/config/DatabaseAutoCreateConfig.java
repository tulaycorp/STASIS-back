package com.stasis.stasis.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.EnvironmentAware;
import org.springframework.core.Ordered;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

@Component
public class DatabaseAutoCreateConfig implements BeanFactoryPostProcessor, EnvironmentAware, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseAutoCreateConfig.class);
    
    private Environment environment;

    @Override
    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        createDatabaseIfNotExists();
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    private void createDatabaseIfNotExists() {
        // Get datasource properties from environment
        String datasourceUrl = environment.getProperty("spring.datasource.url");
        String datasourceUsername = environment.getProperty("spring.datasource.username");
        String datasourcePassword = environment.getProperty("spring.datasource.password");
        
        if (datasourceUrl == null || datasourceUsername == null || datasourcePassword == null) {
            logger.warn("Database configuration not found. Skipping database auto-creation.");
            return;
        }
        
        // Extract database name from URL
        String databaseName = extractDatabaseName(datasourceUrl);
        if (databaseName == null) {
            logger.warn("Could not extract database name from URL: {}", datasourceUrl);
            return;
        }

        // Create connection URL to PostgreSQL server (without specific database)
        String serverUrl = datasourceUrl.substring(0, datasourceUrl.lastIndexOf('/'));
        
        try {
            // Connect to PostgreSQL server
            try (Connection connection = DriverManager.getConnection(serverUrl + "/postgres", 
                    datasourceUsername, datasourcePassword)) {
                
                // Check if database exists
                if (!databaseExists(connection, databaseName)) {
                    logger.info("Database '{}' does not exist. Creating it...", databaseName);
                    createDatabase(connection, databaseName);
                    logger.info("Database '{}' created successfully.", databaseName);
                } else {
                    logger.info("Database '{}' already exists.", databaseName);
                }
            }
        } catch (SQLException e) {
            logger.error("Error while checking/creating database: {}", e.getMessage());
            // Check if it's a connection error
            if (e.getMessage().contains("Connection refused") || 
                e.getMessage().contains("Connection timed out")) {
                logger.error("Cannot connect to PostgreSQL server. Please ensure PostgreSQL is running.");
            } else if (e.getMessage().contains("authentication failed")) {
                logger.error("Authentication failed. Please check your database credentials.");
            }
            // Log the error but don't prevent application startup
            logger.debug("Full stack trace:", e);
        }
    }

    private String extractDatabaseName(String url) {
        try {
            // Extract database name from JDBC URL
            // Example: jdbc:postgresql://localhost:5432/stasis -> stasis
            int lastSlashIndex = url.lastIndexOf('/');
            if (lastSlashIndex != -1 && lastSlashIndex < url.length() - 1) {
                String dbPart = url.substring(lastSlashIndex + 1);
                // Remove any query parameters
                int queryIndex = dbPart.indexOf('?');
                if (queryIndex != -1) {
                    dbPart = dbPart.substring(0, queryIndex);
                }
                return dbPart;
            }
        } catch (Exception e) {
            logger.error("Error extracting database name: {}", e.getMessage());
        }
        return null;
    }

    private boolean databaseExists(Connection connection, String databaseName) throws SQLException {
        String query = "SELECT 1 FROM pg_database WHERE datname = ?";
        try (var preparedStatement = connection.prepareStatement(query)) {
            preparedStatement.setString(1, databaseName);
            try (ResultSet resultSet = preparedStatement.executeQuery()) {
                return resultSet.next();
            }
        }
    }

    private void createDatabase(Connection connection, String databaseName) throws SQLException {
        // Validate database name to prevent SQL injection
        if (!isValidDatabaseName(databaseName)) {
            throw new SQLException("Invalid database name: " + databaseName);
        }
        
        String createDbQuery = "CREATE DATABASE \"" + databaseName + "\"";
        try (Statement statement = connection.createStatement()) {
            statement.executeUpdate(createDbQuery);
        }
    }

    private boolean isValidDatabaseName(String databaseName) {
        // Basic validation - database name should only contain alphanumeric characters and underscores
        return databaseName != null && 
               databaseName.matches("[a-zA-Z0-9_]+") && 
               databaseName.length() > 0 && 
               databaseName.length() <= 63; // PostgreSQL limit
    }
}

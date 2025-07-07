FROM openjdk:17-jdk-alpine
VOLUME /tmp

# Create a non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy the jar file
COPY target/stasis-0.0.1-SNAPSHOT.jar stasisback.jar

# Change ownership to non-root user
RUN chown appuser:appgroup stasisback.jar

# Switch to non-root user
USER appuser

# Environment variables
ARG JAVA_OPTS
ENV JAVA_OPTS=$JAVA_OPTS

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

EXPOSE 8080

# Optimized entrypoint for faster startup
ENTRYPOINT exec java $JAVA_OPTS \
  -Djava.security.egd=file:/dev/./urandom \
  -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:prod} \
  -jar stasisback.jar

#!/bin/bash

# STASIS Backend Deployment Script for Digital Ocean
# This script handles the complete deployment process

set -e

# Configuration
APP_NAME="stasis-backend"
DOMAIN="api.stasis-edu.tech"
COMPOSE_FILE="docker-compose.prod.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    error "Please don't run this script as root"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

log "🚀 Starting STASIS Backend deployment..."

# Build the application
log "🔨 Building Spring Boot application..."
if [ -f "mvnw" ]; then
    # Ensure mvnw has execute permissions
    chmod +x mvnw
    ./mvnw clean package -DskipTests
else
    mvn clean package -DskipTests
fi

if [ $? -eq 0 ]; then
    success "Application built successfully"
else
    error "Failed to build application"
    exit 1
fi

# Stop existing containers
log "🛑 Stopping existing containers..."
docker-compose -f $COMPOSE_FILE down --remove-orphans

# Build Docker image
log "🐳 Building Docker image..."
docker-compose -f $COMPOSE_FILE build --no-cache

if [ $? -eq 0 ]; then
    success "Docker image built successfully"
else
    error "Failed to build Docker image"
    exit 1
fi

# Start the application
log "🚀 Starting application containers..."
docker-compose -f $COMPOSE_FILE up -d

# Wait for application to be ready
log "⏳ Waiting for application to be ready..."
RETRY_COUNT=0
MAX_RETRIES=30

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose -f $COMPOSE_FILE exec -T stasisback wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health 2>/dev/null; then
        success "Application is ready!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    error "Application failed to start within expected time"
    log "📋 Checking application logs..."
    docker-compose -f $COMPOSE_FILE logs stasisback
    exit 1
fi

# Check SSL certificate status
if [ -d "certbot/conf/live/$DOMAIN" ]; then
    success "SSL certificates are configured"
    
    # Test HTTPS endpoint
    log "🔐 Testing HTTPS endpoint..."
    if curl -f -s https://$DOMAIN/actuator/health > /dev/null; then
        success "HTTPS endpoint is working"
    else
        warning "HTTPS endpoint test failed - check nginx configuration"
    fi
else
    warning "SSL certificates not found. Run ./scripts/init-ssl.sh to set up SSL"
fi

# Display deployment status
log "📊 Deployment Status:"
docker-compose -f $COMPOSE_FILE ps

# Display useful information
echo ""
success "🎉 Deployment completed successfully!"
echo ""
echo "📋 Application Information:"
echo "   🌐 API URL: https://$DOMAIN"
echo "   🏥 Health Check: https://$DOMAIN/actuator/health"
echo "   📊 Metrics: https://$DOMAIN/actuator/metrics"
echo "   📝 Info: https://$DOMAIN/actuator/info"
echo ""
echo "🔧 Management Commands:"
echo "   📋 View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "   🔄 Restart: docker-compose -f $COMPOSE_FILE restart"
echo "   🛑 Stop: docker-compose -f $COMPOSE_FILE down"
echo "   📊 Status: docker-compose -f $COMPOSE_FILE ps"
echo ""
echo "🔐 SSL Commands:"
echo "   🆕 Setup SSL: ./scripts/init-ssl.sh"
echo "   🔄 Renew certificates: docker-compose -f $COMPOSE_FILE exec certbot certbot renew"
echo ""

# Test basic API endpoints
log "🧪 Running basic API tests..."
echo "Testing health endpoint..."
if curl -f -s http://localhost:8080/actuator/health | grep -q "UP"; then
    success "Health endpoint is working"
else
    warning "Health endpoint test failed"
fi

log "✨ Deployment script completed!"

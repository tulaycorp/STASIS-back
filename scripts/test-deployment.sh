#!/bin/bash

# Test Deployment Script
# This script tests the deployment setup locally before deploying to production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

log "🧪 Starting deployment test..."

# Check if required files exist
log "📋 Checking required files..."
REQUIRED_FILES=(
    "Dockerfile"
    "docker-compose.prod.yml"
    "nginx/nginx.conf"
    "nginx/conf.d/api.stasis-edu.tech.conf"
    "src/main/resources/application-prod.properties"
    "scripts/deploy.sh"
    "scripts/init-ssl.sh"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        success "Found: $file"
    else
        error "Missing: $file"
        exit 1
    fi
done

# Test Maven build
log "🔨 Testing Maven build..."
if [ -f "mvnw" ]; then
    ./mvnw clean package -DskipTests
else
    mvn clean package -DskipTests
fi

if [ $? -eq 0 ]; then
    success "Maven build successful"
else
    error "Maven build failed"
    exit 1
fi

# Test Docker build
log "🐳 Testing Docker build..."
docker build -t stasis-test .

if [ $? -eq 0 ]; then
    success "Docker build successful"
else
    error "Docker build failed"
    exit 1
fi

# Test Docker run
log "🚀 Testing Docker run..."
docker run -d --name stasis-test-container \
    -p 8081:8080 \
    -e SPRING_PROFILES_ACTIVE=supabase \
    stasis-test

# Wait for application to start
log "⏳ Waiting for application to start..."
sleep 30

# Test health endpoint
log "🏥 Testing health endpoint..."
if curl -f -s http://localhost:8081/actuator/health | grep -q "UP"; then
    success "Health endpoint is working"
else
    warning "Health endpoint test failed"
fi

# Cleanup
log "🧹 Cleaning up test containers..."
docker stop stasis-test-container || true
docker rm stasis-test-container || true
docker rmi stasis-test || true

# Test nginx configuration
log "🌐 Testing nginx configuration..."
docker run --rm -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
    -v $(pwd)/nginx/conf.d:/etc/nginx/conf.d:ro \
    nginx:alpine nginx -t

if [ $? -eq 0 ]; then
    success "Nginx configuration is valid"
else
    error "Nginx configuration has errors"
    exit 1
fi

# Test docker-compose configuration
log "🐙 Testing docker-compose configuration..."
docker-compose -f docker-compose.prod.yml config > /dev/null

if [ $? -eq 0 ]; then
    success "Docker Compose configuration is valid"
else
    error "Docker Compose configuration has errors"
    exit 1
fi

# Check script permissions
log "🔐 Checking script permissions..."
if [ -x "scripts/deploy.sh" ] && [ -x "scripts/init-ssl.sh" ]; then
    success "Scripts have execute permissions"
else
    warning "Scripts may need execute permissions"
    echo "Run: chmod +x scripts/*.sh"
fi

success "🎉 All tests passed! Deployment setup is ready."
echo ""
echo "📋 Next steps for production deployment:"
echo "   1. Set up Digital Ocean droplet"
echo "   2. Point api.stasis-edu.tech to droplet IP"
echo "   3. Copy project to droplet"
echo "   4. Run ./scripts/deploy.sh"
echo "   5. Run ./scripts/init-ssl.sh"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"

#!/bin/bash

# STASIS Backend Troubleshooting Script
# This script helps diagnose and fix common deployment issues

set -e

echo "🔍 STASIS Backend Troubleshooting Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Starting troubleshooting process..."

# Check if Docker is running
print_status "Checking Docker status..."
if systemctl is-active --quiet docker; then
    print_success "Docker is running"
else
    print_error "Docker is not running"
    print_status "Starting Docker..."
    systemctl start docker
fi

# Check Docker containers
print_status "Checking Docker containers..."
echo "Running containers:"
docker ps

echo ""
echo "All containers (including stopped):"
docker ps -a

# Check if STASIS container is running
if docker ps | grep -q "stasis-api"; then
    print_success "STASIS container is running"
    
    # Check container logs
    print_status "Checking container logs (last 20 lines)..."
    docker logs --tail 20 stasis-api
    
    # Check if application is responding inside container
    print_status "Testing application health inside container..."
    if docker exec stasis-api curl -f http://localhost:8080/actuator/health 2>/dev/null; then
        print_success "Application is healthy inside container"
    else
        print_error "Application is not responding inside container"
        print_status "Full container logs:"
        docker logs stasis-api
    fi
    
else
    print_error "STASIS container is not running"
    
    # Check if container exists but is stopped
    if docker ps -a | grep -q "stasis-api"; then
        print_warning "Container exists but is stopped. Starting it..."
        docker start stasis-api
        sleep 10
        
        # Check again
        if docker ps | grep -q "stasis-api"; then
            print_success "Container started successfully"
        else
            print_error "Failed to start container. Checking logs..."
            docker logs stasis-api
        fi
    else
        print_error "Container doesn't exist. Need to run deployment script."
        print_status "Run: ./deploy.sh"
    fi
fi

# Check port binding
print_status "Checking port 8080 binding..."
if netstat -tlnp | grep ":8080"; then
    print_success "Port 8080 is bound"
    netstat -tlnp | grep ":8080"
else
    print_error "Port 8080 is not bound"
fi

# Test local connectivity
print_status "Testing local connectivity to port 8080..."
if curl -f http://localhost:8080/actuator/health 2>/dev/null; then
    print_success "Local application is responding"
    curl http://localhost:8080/actuator/health
else
    print_error "Local application is not responding"
fi

# Check nginx status
print_status "Checking nginx status..."
if systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
    
    # Test nginx configuration
    print_status "Testing nginx configuration..."
    if nginx -t; then
        print_success "Nginx configuration is valid"
    else
        print_error "Nginx configuration has errors"
    fi
    
    # Check nginx error logs
    print_status "Checking nginx error logs (last 10 lines)..."
    tail -10 /var/log/nginx/error.log
    
else
    print_error "Nginx is not running"
    print_status "Starting nginx..."
    systemctl start nginx
fi

# Check firewall
print_status "Checking firewall status..."
if command -v ufw &> /dev/null; then
    ufw status
else
    print_warning "UFW not installed"
fi

# Check SSL certificate
print_status "Checking SSL certificate..."
if [ -f "/etc/letsencrypt/live/api.stasis-edu.tech/fullchain.pem" ]; then
    print_success "SSL certificate exists"
    openssl x509 -in /etc/letsencrypt/live/api.stasis-edu.tech/fullchain.pem -text -noout | grep -A 2 "Validity"
else
    print_error "SSL certificate not found"
fi

# Provide recommendations
echo ""
print_status "Troubleshooting Summary and Recommendations:"
echo "=============================================="

if ! docker ps | grep -q "stasis-api"; then
    print_error "1. STASIS container is not running"
    echo "   Solution: Run './deploy.sh' to start the application"
fi

if ! curl -f http://localhost:8080/actuator/health &>/dev/null; then
    print_error "2. Application is not responding on port 8080"
    echo "   Solutions:"
    echo "   - Check container logs: docker logs stasis-api"
    echo "   - Restart container: docker-compose restart"
    echo "   - Rebuild and restart: docker-compose down && docker-compose up -d"
fi

if ! systemctl is-active --quiet nginx; then
    print_error "3. Nginx is not running"
    echo "   Solution: sudo systemctl start nginx"
fi

print_status "Quick fix commands:"
echo "==================="
echo "1. Restart everything: docker-compose down && docker-compose up -d && sudo systemctl restart nginx"
echo "2. Check logs: docker-compose logs -f"
echo "3. Test health: curl http://localhost:8080/actuator/health"
echo "4. Test HTTPS: curl https://api.stasis-edu.tech/actuator/health"

print_status "Troubleshooting completed!"

#!/bin/bash

# STASIS Backend Deployment Script for Digital Ocean
# This script helps deploy the STASIS backend API to Digital Ocean

set -e

echo "🚀 STASIS Backend Deployment Script"
echo "=================================="

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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Building Docker image..."
docker build -t stasis-backend:latest .

if [ $? -eq 0 ]; then
    print_success "Docker image built successfully!"
else
    print_error "Failed to build Docker image"
    exit 1
fi

print_status "Starting application with Docker Compose..."
docker-compose down --remove-orphans
docker-compose up -d

if [ $? -eq 0 ]; then
    print_success "Application started successfully!"
    echo ""
    print_status "Application is running on:"
    echo "  - Local: http://localhost:8080"
    echo "  - Health Check: http://localhost:8080/actuator/health"
    echo "  - API Documentation: http://localhost:8080/actuator/info"
    echo ""
    print_status "Checking application health..."
    
    # Wait for application to start
    sleep 30
    
    # Health check
    if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
        print_success "Application is healthy and ready to serve requests!"
    else
        print_warning "Application may still be starting up. Check logs with: docker-compose logs -f"
    fi
    
    echo ""
    print_status "Useful commands:"
    echo "  - View logs: docker-compose logs -f"
    echo "  - Stop application: docker-compose down"
    echo "  - Restart application: docker-compose restart"
    echo "  - View running containers: docker ps"
    
else
    print_error "Failed to start application"
    exit 1
fi

echo ""
print_status "Deployment completed!"
print_warning "Don't forget to:"
echo "  1. Configure your domain (api.stasis-edu.tech) to point to this server"
echo "  2. Set up SSL/TLS certificate (recommended: Let's Encrypt with nginx)"
echo "  3. Configure firewall to allow traffic on port 8080"
echo "  4. Set up monitoring and log aggregation"

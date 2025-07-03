#!/bin/bash

# STASIS Application Build and Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    log_success "Docker is running"
}

# Build images
build_images() {
    log_info "Building Docker images..."
    
    # Build backend
    log_info "Building backend image..."
    docker build -t stasis-backend:latest .
    
    # Build frontend
    log_info "Building frontend image..."
    docker build -t stasis-frontend:latest ./frontend
    
    log_success "All images built successfully"
}

# Start development environment
start_dev() {
    log_info "Starting development environment..."
    docker-compose up -d
    log_success "Development environment started"
    log_info "Frontend: http://localhost"
    log_info "Backend: http://localhost:8080"
    log_info "Database: localhost:5432"
}

# Start production environment
start_prod() {
    log_info "Starting production environment..."
    
    if [ ! -f .env ]; then
        log_warning ".env file not found. Creating from template..."
        cp .env.example .env
        log_warning "Please edit .env file with your production values before running again."
        exit 1
    fi
    
    docker-compose -f docker-compose.prod.yml up -d
    log_success "Production environment started"
}

# Stop all services
stop_all() {
    log_info "Stopping all services..."
    docker-compose down
    docker-compose -f docker-compose.prod.yml down
    log_success "All services stopped"
}

# Clean up
cleanup() {
    log_info "Cleaning up Docker resources..."
    docker system prune -f
    log_success "Cleanup completed"
}

# Show help
show_help() {
    echo "STASIS Docker Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build       Build Docker images"
    echo "  dev         Start development environment"
    echo "  prod        Start production environment"
    echo "  stop        Stop all services"
    echo "  restart     Restart services"
    echo "  logs        Show logs"
    echo "  cleanup     Clean up Docker resources"
    echo "  help        Show this help message"
    echo ""
}

# Main script
case "${1:-}" in
    "build")
        check_docker
        build_images
        ;;
    "dev")
        check_docker
        build_images
        start_dev
        ;;
    "prod")
        check_docker
        build_images
        start_prod
        ;;
    "stop")
        stop_all
        ;;
    "restart")
        stop_all
        sleep 2
        start_dev
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|"")
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac

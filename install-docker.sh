#!/bin/bash

# Docker Installation Script for Ubuntu/Debian
# This script installs Docker and Docker Compose on Ubuntu/Debian systems

set -e

echo "🐳 Docker Installation Script for STASIS Backend"
echo "================================================"

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

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    print_error "Cannot detect OS version"
    exit 1
fi

print_status "Detected OS: $OS $VER"

# Check if Docker is already installed
if command -v docker &> /dev/null; then
    print_warning "Docker is already installed"
    docker --version
    if command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose is already installed"
        docker-compose --version
        print_success "Docker and Docker Compose are ready!"
        exit 0
    fi
fi

print_status "Updating package index..."
apt-get update

print_status "Installing required packages..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

print_status "Adding Docker's official GPG key..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

print_status "Setting up Docker repository..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

print_status "Updating package index with Docker packages..."
apt-get update

print_status "Installing Docker Engine..."
apt-get install -y docker-ce docker-ce-cli containerd.io

print_status "Starting and enabling Docker service..."
systemctl start docker
systemctl enable docker

print_status "Installing Docker Compose..."
DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

print_status "Creating docker group and adding current user..."
groupadd -f docker
if [ -n "$SUDO_USER" ]; then
    usermod -aG docker $SUDO_USER
    print_warning "Please log out and log back in for group changes to take effect"
fi

print_status "Testing Docker installation..."
if docker run hello-world > /dev/null 2>&1; then
    print_success "Docker is working correctly!"
else
    print_error "Docker installation may have issues"
fi

print_status "Verifying installations..."
echo "Docker version:"
docker --version
echo "Docker Compose version:"
docker-compose --version

print_success "Docker and Docker Compose installation completed!"
echo ""
print_status "Next steps:"
echo "1. If you're not root, log out and log back in to use Docker without sudo"
echo "2. Run the deployment script: ./deploy.sh"
echo "3. Configure firewall to allow port 8080:"
echo "   ufw allow 8080"
echo "4. Set up your domain to point to this server"

print_warning "Security recommendations:"
echo "- Configure UFW firewall: ufw enable"
echo "- Only allow necessary ports: ufw allow ssh, ufw allow 80, ufw allow 443"
echo "- Keep system updated: apt update && apt upgrade"

#!/bin/bash

# SSL Setup Script for STASIS Backend API
# This script sets up nginx reverse proxy with Let's Encrypt SSL for api.stasis-edu.tech

set -e

echo "🔒 STASIS Backend SSL Setup Script"
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

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run this script as root (use sudo)"
    exit 1
fi

DOMAIN="api.stasis-edu.tech"

print_status "Setting up SSL for domain: $DOMAIN"

# Check if domain is pointing to this server
print_status "Checking if domain is pointing to this server..."
SERVER_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)

if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    print_warning "Domain $DOMAIN resolves to $DOMAIN_IP but server IP is $SERVER_IP"
    print_warning "SSL setup may fail if domain is not properly configured"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    print_success "Domain is correctly pointing to this server ($SERVER_IP)"
fi

# Update package list
print_status "Updating package list..."
apt-get update

# Install nginx
print_status "Installing nginx..."
apt-get install -y nginx

# Install certbot
print_status "Installing certbot and nginx plugin..."
apt-get install -y certbot python3-certbot-nginx

# Create initial HTTP-only nginx configuration for certificate generation
print_status "Creating initial HTTP nginx configuration..."
cat > /etc/nginx/sites-available/stasis-api << 'EOF'
server {
    listen 80;
    server_name api.stasis-edu.tech;
    
    # Allow Let's Encrypt challenges
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Proxy all other requests to the backend
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
}
EOF

# Remove default nginx site
print_status "Removing default nginx configuration..."
rm -f /etc/nginx/sites-enabled/default

# Enable the new site
print_status "Enabling STASIS API site..."
ln -sf /etc/nginx/sites-available/stasis-api /etc/nginx/sites-enabled/

# Test nginx configuration
print_status "Testing nginx configuration..."
if nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration is invalid"
    exit 1
fi

# Start and enable nginx
print_status "Starting nginx..."
systemctl start nginx
systemctl enable nginx

# Check if the backend is running
print_status "Checking if STASIS backend is running..."
if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
    print_success "STASIS backend is running"
else
    print_warning "STASIS backend is not responding on localhost:8080"
    print_status "This might be due to port binding configuration."
    print_status "Attempting to restart the application with correct port binding..."
    
    # Try to restart with correct configuration
    if command -v docker-compose &> /dev/null; then
        print_status "Restarting application..."
        docker-compose down
        docker-compose up -d
        
        # Wait for application to start
        print_status "Waiting for application to start (60 seconds)..."
        sleep 60
        
        # Check again
        if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
            print_success "STASIS backend is now running and healthy"
        else
            print_error "STASIS backend is still not responding"
            print_status "Please check:"
            echo "  1. Run: docker-compose ps"
            echo "  2. Check logs: docker-compose logs -f"
            echo "  3. Test manually: curl http://localhost:8080/actuator/health"
            read -p "Continue with SSL setup anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    else
        print_error "docker-compose not found. Please ensure the application is running on port 8080"
        read -p "Continue with SSL setup anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Create webroot directory for Let's Encrypt
print_status "Creating webroot directory for Let's Encrypt..."
mkdir -p /var/www/html

# Obtain SSL certificate
print_status "Obtaining SSL certificate from Let's Encrypt..."
print_warning "This will modify your nginx configuration automatically"

# Run certbot
if certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@stasis-edu.tech --redirect; then
    print_success "SSL certificate obtained and configured successfully!"
    
    # Create enhanced HTTPS configuration
    print_status "Creating enhanced HTTPS configuration..."
    cat > /etc/nginx/sites-available/stasis-api << 'EOF'
server {
    listen 80;
    server_name api.stasis-edu.tech;
    
    # Redirect all HTTP requests to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name api.stasis-edu.tech;
    
    # SSL configuration (managed by certbot)
    ssl_certificate /etc/letsencrypt/live/api.stasis-edu.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.stasis-edu.tech/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
    # Proxy configuration
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # Health check endpoint
    location /actuator/health {
        proxy_pass http://localhost:8080/actuator/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files (if any)
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # Test and reload nginx with new configuration
    print_status "Testing enhanced nginx configuration..."
    if nginx -t; then
        print_status "Reloading nginx with enhanced configuration..."
        systemctl reload nginx
        print_success "Enhanced HTTPS configuration applied!"
    else
        print_warning "Enhanced configuration has issues, keeping certbot's default configuration"
    fi
    
else
    print_error "Failed to obtain SSL certificate"
    print_status "Common issues:"
    echo "  1. Domain not pointing to this server"
    echo "  2. Port 80/443 not accessible from internet"
    echo "  3. Firewall blocking connections"
    echo "  4. Rate limiting from Let's Encrypt"
    exit 1
fi

# Set up automatic renewal
print_status "Setting up automatic certificate renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Configure firewall if UFW is active
if ufw status | grep -q "Status: active"; then
    print_status "Configuring firewall..."
    ufw allow 'Nginx Full'
    ufw delete allow 'Nginx HTTP' 2>/dev/null || true
    ufw reload
fi

# Test the SSL setup
print_status "Testing SSL configuration..."
sleep 5

if curl -f https://$DOMAIN/actuator/health > /dev/null 2>&1; then
    print_success "SSL setup completed successfully!"
    echo ""
    print_status "Your API is now available at:"
    echo "  🔒 https://$DOMAIN"
    echo "  🔒 https://$DOMAIN/actuator/health"
    echo "  🔒 https://$DOMAIN/api/"
    echo ""
    print_status "SSL Certificate Information:"
    certbot certificates
    echo ""
    print_success "Automatic renewal is configured via cron job"
else
    print_warning "SSL certificate installed but API may not be responding"
    print_status "Check your application logs: docker-compose logs -f"
fi

print_status "SSL setup completed!"
print_warning "Important notes:"
echo "  1. Certificate will auto-renew every 60 days"
echo "  2. HTTP traffic is automatically redirected to HTTPS"
echo "  3. Security headers are configured for better protection"
echo "  4. Gzip compression is enabled for better performance"

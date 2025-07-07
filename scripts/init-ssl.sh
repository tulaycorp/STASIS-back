#!/bin/bash

# SSL Certificate Setup Script for STASIS Backend
# This script sets up Let's Encrypt SSL certificates for api.stasis-edu.tech

set -e

DOMAIN="api.stasis-edu.tech"
EMAIL="admin@stasis-edu.tech"  # Change this to your email
STAGING=0  # Set to 1 for testing with staging certificates

echo "🔐 Setting up SSL certificates for $DOMAIN"

# Create required directories
echo "📁 Creating certificate directories..."
mkdir -p certbot/conf
mkdir -p certbot/www

# Check if certificates already exist
if [ -d "certbot/conf/live/$DOMAIN" ]; then
    echo "⚠️  Certificates for $DOMAIN already exist!"
    read -p "Do you want to renew them? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Exiting without changes"
        exit 0
    fi
fi

# Determine if we should use staging
if [ $STAGING != "0" ]; then
    STAGING_ARG="--staging"
    echo "🧪 Using Let's Encrypt staging environment"
else
    STAGING_ARG=""
    echo "🚀 Using Let's Encrypt production environment"
fi

# Start nginx temporarily for certificate validation
echo "🌐 Starting temporary nginx for certificate validation..."
docker-compose -f docker-compose.prod.yml up -d nginx

# Wait for nginx to be ready
echo "⏳ Waiting for nginx to be ready..."
sleep 10

# Request certificate
echo "📜 Requesting SSL certificate for $DOMAIN..."
docker-compose -f docker-compose.prod.yml run --rm certbot \
    certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    $STAGING_ARG \
    -d $DOMAIN

if [ $? -eq 0 ]; then
    echo "✅ SSL certificate successfully obtained for $DOMAIN"
    
    # Restart nginx to load the new certificates
    echo "🔄 Restarting nginx with SSL configuration..."
    docker-compose -f docker-compose.prod.yml restart nginx
    
    echo "🎉 SSL setup complete!"
    echo "📋 Your API is now available at: https://$DOMAIN"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Update your DNS to point $DOMAIN to this server's IP"
    echo "   2. Test the API: curl https://$DOMAIN/actuator/health"
    echo "   3. Set up automatic certificate renewal (already configured)"
    
else
    echo "❌ Failed to obtain SSL certificate"
    echo "🔍 Check the logs above for details"
    echo "💡 Common issues:"
    echo "   - DNS not pointing to this server"
    echo "   - Firewall blocking port 80/443"
    echo "   - Domain not accessible from internet"
    exit 1
fi

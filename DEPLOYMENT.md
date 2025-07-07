# STASIS Backend Deployment Guide for Digital Ocean

This guide will help you deploy the STASIS backend application to a Digital Ocean droplet with SSL support.

## Prerequisites

- Digital Ocean droplet (Ubuntu 20.04+ recommended)
- Domain name pointing to your droplet IP (`api.stasis-edu.tech`)
- SSH access to your droplet
- Git installed on the droplet

## Server Requirements

- **Minimum**: 1 GB RAM, 1 vCPU, 25 GB SSD
- **Recommended**: 2 GB RAM, 1 vCPU, 50 GB SSD
- **Ports**: 22 (SSH), 80 (HTTP), 443 (HTTPS), 8080 (Application - internal)

## Step 1: Prepare Your Digital Ocean Droplet

### 1.1 Create and Configure Droplet

1. Create a new Ubuntu 20.04+ droplet on Digital Ocean
2. Add your SSH key during creation
3. Note the droplet's IP address

### 1.2 Update DNS Records

Point your domain to the droplet:
```
A Record: api.stasis-edu.tech → YOUR_DROPLET_IP
```

### 1.3 Initial Server Setup

SSH into your droplet:
```bash
ssh root@YOUR_DROPLET_IP
```

Update the system:
```bash
apt update && apt upgrade -y
```

Create a non-root user:
```bash
adduser stasis
usermod -aG sudo stasis
```

## Step 2: Install Dependencies

### 2.1 Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Add user to docker group
usermod -aG docker stasis

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 2.2 Install Java (for building)

```bash
apt install openjdk-17-jdk maven -y
```

### 2.3 Configure Firewall

```bash
# Install and configure UFW
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable
```

## Step 3: Deploy the Application

### 3.1 Clone the Repository

Switch to the stasis user:
```bash
su - stasis
```

Clone your repository:
```bash
git clone https://github.com/tulaycorp/STASIS-back.git
cd STASIS-back
```

### 3.2 Configure Environment

Copy and edit the environment file:
```bash
cp .env.example .env
nano .env
```

Update the values in `.env` file:
- Database credentials
- Domain name
- Email for SSL certificates

### 3.3 Make Scripts Executable

```bash
chmod +x scripts/*.sh
```

### 3.4 Deploy the Application

Run the deployment script:
```bash
./scripts/deploy.sh
```

This script will:
- Build the Spring Boot application
- Create Docker images
- Start all containers
- Run health checks

## Step 4: Set Up SSL Certificates

### 4.1 Initialize SSL

Run the SSL setup script:
```bash
./scripts/init-ssl.sh
```

This will:
- Request Let's Encrypt certificates
- Configure automatic renewal
- Restart nginx with SSL

### 4.2 Verify SSL Setup

Test your SSL configuration:
```bash
curl -I https://api.stasis-edu.tech/actuator/health
```

## Step 5: Verify Deployment

### 5.1 Check Application Status

```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check application logs
docker-compose -f docker-compose.prod.yml logs -f stasisback

# Check nginx logs
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### 5.2 Test API Endpoints

```bash
# Health check
curl https://api.stasis-edu.tech/actuator/health

# Application info
curl https://api.stasis-edu.tech/actuator/info

# Test CORS (from your frontend domain)
curl -H "Origin: https://stasis-edu.tech" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://api.stasis-edu.tech/api/auth/login
```

## Step 6: Monitoring and Maintenance

### 6.1 Set Up Log Rotation

Create log rotation configuration:
```bash
sudo nano /etc/logrotate.d/docker-containers
```

Add:
```
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size=1M
    missingok
    delaycompress
    copytruncate
}
```

### 6.2 Set Up Monitoring

Monitor your application:
```bash
# Real-time logs
docker-compose -f docker-compose.prod.yml logs -f

# Container stats
docker stats

# System resources
htop
```

### 6.3 Backup Strategy

Create a backup script:
```bash
nano scripts/backup.sh
```

```bash
#!/bin/bash
# Simple backup script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/stasis/backups"

mkdir -p $BACKUP_DIR

# Backup application data (if any persistent volumes)
docker-compose -f docker-compose.prod.yml exec stasisback pg_dump $DATABASE_URL > $BACKUP_DIR/db_backup_$DATE.sql

# Backup SSL certificates
tar -czf $BACKUP_DIR/ssl_backup_$DATE.tar.gz certbot/

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## Troubleshooting

### Common Issues

1. **SSL Certificate Issues**
   ```bash
   # Check certificate status
   docker-compose -f docker-compose.prod.yml exec certbot certbot certificates
   
   # Renew certificates manually
   docker-compose -f docker-compose.prod.yml exec certbot certbot renew --dry-run
   ```

2. **Application Won't Start**
   ```bash
   # Check application logs
   docker-compose -f docker-compose.prod.yml logs stasisback
   
   # Check if port is available
   netstat -tulpn | grep :8080
   ```

3. **Database Connection Issues**
   ```bash
   # Test database connection
   docker-compose -f docker-compose.prod.yml exec stasisback \
     java -cp /app/stasisback.jar org.springframework.boot.loader.JarLauncher \
     --spring.profiles.active=prod --logging.level.org.springframework.jdbc=DEBUG
   ```

4. **Nginx Issues**
   ```bash
   # Test nginx configuration
   docker-compose -f docker-compose.prod.yml exec nginx nginx -t
   
   # Reload nginx
   docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
   ```

### Performance Tuning

1. **JVM Tuning**
   Edit `docker-compose.prod.yml` and adjust `JAVA_OPTS`:
   ```yaml
   environment:
     - JAVA_OPTS=-Xmx1g -Xms512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200
   ```

2. **Database Connection Pool**
   Edit `application-prod.properties`:
   ```properties
   spring.datasource.hikari.maximum-pool-size=20
   spring.datasource.hikari.minimum-idle=10
   ```

## Security Considerations

1. **Regular Updates**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Update Docker images
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Firewall Configuration**
   ```bash
   # Review firewall rules
   sudo ufw status verbose
   
   # Block unnecessary ports
   sudo ufw deny 8080  # Block direct access to application
   ```

3. **SSL Security**
   - Certificates auto-renew every 12 hours
   - Strong SSL configuration is already applied
   - HSTS headers are enabled

## Support

For issues related to:
- **Application**: Check application logs and Spring Boot documentation
- **Docker**: Check Docker and Docker Compose documentation
- **SSL**: Check Let's Encrypt documentation
- **Nginx**: Check Nginx documentation

## Useful Commands

```bash
# Restart entire stack
docker-compose -f docker-compose.prod.yml restart

# Update application only
docker-compose -f docker-compose.prod.yml up -d --build stasisback

# View real-time logs
docker-compose -f docker-compose.prod.yml logs -f

# Check SSL certificate expiry
docker-compose -f docker-compose.prod.yml exec certbot certbot certificates

# Manual certificate renewal
docker-compose -f docker-compose.prod.yml exec certbot certbot renew

# Backup database
docker-compose -f docker-compose.prod.yml exec stasisback pg_dump $DATABASE_URL > backup.sql

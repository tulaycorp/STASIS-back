# STASIS DigitalOcean Quick Setup Guide

This guide provides a quick overview of deploying STASIS to DigitalOcean.

## Prerequisites

1. **DigitalOcean Account** - Sign up at https://digitalocean.com
2. **DigitalOcean CLI (doctl)** - Install from https://docs.digitalocean.com/reference/doctl/how-to/install/
3. **Docker & Docker Compose** - Install from https://docker.com
4. **SSH Key** - Add to your DigitalOcean account

## Authentication Setup

```bash
# Install and authenticate doctl
doctl auth init

# Verify authentication
doctl account get
```

## Quick Deployment Options

### Option 1: Automated Droplet Deployment (Recommended)

```bash
# Make script executable (Linux/Mac)
chmod +x deploy-digitalocean.sh

# Create and setup droplet
./deploy-digitalocean.sh droplet setup

# Deploy application
./deploy-digitalocean.sh droplet deploy
```

**Windows:**
```cmd
# Create and setup droplet
deploy-digitalocean.cmd droplet setup

# Deploy application
deploy-digitalocean.cmd droplet deploy
```

### Option 2: DigitalOcean App Platform

```bash
# Deploy to App Platform (automatic scaling)
./deploy-digitalocean.sh app-platform deploy
```

### Option 3: Manual Droplet Setup

1. **Create Droplet:**
   - Image: Ubuntu 20.04 LTS with Docker
   - Size: 4GB RAM, 2 vCPUs (minimum)
   - Add your SSH key

2. **Connect and Setup:**
   ```bash
   ssh root@YOUR_DROPLET_IP
   
   # Update system
   apt update && apt upgrade -y
   
   # Install Docker Compose
   curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   chmod +x /usr/local/bin/docker-compose
   
   # Create app directory
   mkdir -p /opt/stasis
   cd /opt/stasis
   ```

3. **Upload and Deploy:**
   ```bash
   # Upload your files (from local machine)
   scp -r ./STASIS_new/* root@YOUR_DROPLET_IP:/opt/stasis/
   
   # On droplet
   cd /opt/stasis
   cp .env.digitalocean .env
   nano .env  # Edit configuration
   
   # Deploy
   chmod +x deploy.sh
   ./deploy.sh prod
   ```

## Configuration

### Essential Environment Variables

Update `.env` with your values:

```env
# Database
POSTGRES_PASSWORD=your_secure_password

# URLs (replace with your droplet IP)
FRONTEND_URL=http://YOUR_DROPLET_IP
REACT_APP_API_URL=http://YOUR_DROPLET_IP:8080/api

# Security
JWT_SECRET=your_jwt_secret
CORS_ALLOWED_ORIGINS=http://YOUR_DROPLET_IP
```

### Firewall Setup

```bash
# Configure firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## Access Your Application

After deployment:
- **Frontend:** http://YOUR_DROPLET_IP
- **Backend:** http://YOUR_DROPLET_IP:8080
- **Admin Panel:** http://YOUR_DROPLET_IP/admin

## Domain Setup (Optional)

### 1. Point Domain to Droplet
```
# DNS A Record
stasis.yourdomain.com → YOUR_DROPLET_IP
```

### 2. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d stasis.yourdomain.com

# Update .env
FRONTEND_URL=https://stasis.yourdomain.com
USE_HTTPS=true
```

## Monitoring & Maintenance

### Check Application Status
```bash
# Check containers
docker-compose ps

# View logs
docker-compose logs -f

# Check resource usage
docker stats
```

### Backup Database
```bash
# Create backup
docker exec stasis-postgres pg_dump -U postgres stasis > backup.sql

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /opt/stasis/backup.sh
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Update deployment
./deploy-digitalocean.sh droplet update
```

## Troubleshooting

### Common Issues

1. **Connection Refused:**
   ```bash
   # Check if containers are running
   docker-compose ps
   
   # Restart if needed
   docker-compose restart
   ```

2. **Port Already in Use:**
   ```bash
   # Find process using port
   netstat -tlnp | grep :8080
   
   # Kill process
   kill -9 PID
   ```

3. **Database Connection Error:**
   ```bash
   # Check database logs
   docker-compose logs postgres
   
   # Verify password in .env
   cat .env | grep POSTGRES_PASSWORD
   ```

4. **Out of Memory:**
   ```bash
   # Check memory usage
   free -h
   docker stats
   
   # Resize droplet if needed
   doctl compute droplet-action resize DROPLET_ID --size s-4vcpu-8gb
   ```

## Cost Optimization

### Recommended Droplet Sizes

- **Development:** 2GB RAM ($12/month)
- **Small Production:** 4GB RAM ($24/month)
- **Medium Production:** 8GB RAM ($48/month)

### Additional Services

- **Managed Database:** $15/month (recommended for production)
- **Load Balancer:** $12/month (for high availability)
- **Backup Storage:** $0.05/GB/month
- **Monitoring:** Free with DigitalOcean

## Security Best Practices

1. **Enable automatic security updates:**
   ```bash
   dpkg-reconfigure -plow unattended-upgrades
   ```

2. **Change default ports:**
   ```bash
   # Edit SSH port in /etc/ssh/sshd_config
   Port 2222
   ```

3. **Use strong passwords and enable 2FA**

4. **Regular backups and monitoring**

5. **Keep Docker images updated**

## Support

- **DigitalOcean Docs:** https://docs.digitalocean.com
- **Community:** https://www.digitalocean.com/community
- **Docker Docs:** https://docs.docker.com

For STASIS-specific issues, check the main documentation in `DOCKER_DEPLOYMENT.md`.

## Quick Commands Reference

```bash
# Deploy to droplet
./deploy-digitalocean.sh droplet setup
./deploy-digitalocean.sh droplet deploy

# Deploy to App Platform
./deploy-digitalocean.sh app-platform deploy

# Check status
doctl compute droplet list
doctl apps list

# View logs
docker-compose logs -f
doctl apps logs APP_ID

# Update application
./deploy-digitalocean.sh droplet update
git push origin main  # For App Platform auto-deploy
```

---

**Need help?** Check the detailed deployment guide in `DOCKER_DEPLOYMENT.md` for comprehensive instructions.

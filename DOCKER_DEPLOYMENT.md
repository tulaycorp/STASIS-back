# STASIS Dockerized Deployment Guide

This guide explains how to deploy the STASIS application using Docker and Docker Compose.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- 4GB+ RAM available for containers
- 10GB+ free disk space

## Project Structure

```
STASIS_new/
├── Dockerfile                    # Backend Docker configuration
├── docker-compose.yml          # Development environment
├── docker-compose.prod.yml     # Production environment
├── deploy.sh                   # Linux/Mac deployment script
├── deploy.cmd                  # Windows deployment script
├── .env.example                # Environment variables template
├── .dockerignore               # Docker ignore file
├── init-db/                    # Database initialization
│   └── init.sh
├── frontend/
│   ├── Dockerfile              # Frontend Docker configuration
│   ├── nginx.conf              # Nginx configuration
│   └── .dockerignore           # Frontend Docker ignore
└── src/main/resources/
    ├── application-docker.properties      # Docker environment config
    └── application-production.properties  # Production environment config
```

## Quick Start

### Development Environment

1. **Clone and navigate to the project:**
   ```bash
   cd STASIS_new
   ```

2. **Start development environment:**
   ```bash
   # Linux/Mac
   ./deploy.sh dev
   
   # Windows
   deploy.cmd dev
   ```

3. **Access the application:**
   - Frontend: http://localhost
   - Backend: http://localhost:8080
   - Database: localhost:5432

### Production Environment

1. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your production values:**
   ```env
   POSTGRES_DB=stasis
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_secure_password
   SPRING_DATASOURCE_PASSWORD=your_secure_password
   ```

3. **Start production environment:**
   ```bash
   # Linux/Mac
   ./deploy.sh prod
   
   # Windows
   deploy.cmd prod
   ```

## Manual Docker Commands

### Build Images

```bash
# Build backend
docker build -t stasis-backend:latest .

# Build frontend
docker build -t stasis-frontend:latest ./frontend
```

### Run Development Environment

```bash
docker-compose up -d
```

### Run Production Environment

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop Services

```bash
# Development
docker-compose down

# Production
docker-compose -f docker-compose.prod.yml down
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `stasis` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | Required |
| `SPRING_DATASOURCE_URL` | JDBC URL | Auto-configured |
| `SPRING_DATASOURCE_USERNAME` | DB username | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | DB password | Required |

### Application Profiles

- **docker**: Used in development containers
- **production**: Used in production containers with optimized settings

### Database Configuration

The PostgreSQL database is automatically configured with:
- Persistent volume for data
- Health checks
- Automatic initialization scripts
- Connection pooling

### Frontend Configuration

The React frontend is served by Nginx with:
- Production build optimization
- API proxy to backend
- Security headers
- Gzip compression
- Static asset caching

## Scaling and Performance

### Resource Limits

Production containers have resource limits:
- Backend: 768MB memory limit, 512MB reserved
- Frontend: 128MB memory limit, 64MB reserved
- Database: 512MB memory limit, 256MB reserved

### Scaling Services

Scale specific services:
```bash
docker-compose up -d --scale backend=2
```

### Health Checks

All services include health checks:
- Backend: `/actuator/health`
- Frontend: HTTP GET to `/`
- Database: `pg_isready`

## Security

### Production Security Features

- Non-root containers
- Security headers in Nginx
- Secure cookie settings
- Limited exposed ports
- Environment-based secrets

### SSL/TLS (Optional)

To enable HTTPS:

1. Place SSL certificates in `./ssl/` directory
2. Update `docker-compose.prod.yml` to mount certificates
3. Configure Nginx for SSL in `frontend/nginx.conf`

## Monitoring

### Health Endpoints

- Backend health: http://localhost:8080/actuator/health
- Frontend health: http://localhost/health
- Metrics: http://localhost:8080/actuator/metrics

### Logs

Application logs are stored in:
- Backend: `./logs/stasis.log`
- Frontend: Nginx access/error logs in container
- Database: PostgreSQL logs in container

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check port usage
   netstat -tlnp | grep :8080
   # Kill processes using the port
   sudo kill -9 <PID>
   ```

2. **Database connection issues:**
   ```bash
   # Check database logs
   docker-compose logs postgres
   # Verify database is healthy
   docker-compose ps
   ```

3. **Out of memory:**
   ```bash
   # Check container resource usage
   docker stats
   # Increase Docker memory limit
   ```

4. **Build failures:**
   ```bash
   # Clean Docker cache
   docker system prune -f
   # Rebuild without cache
   docker-compose build --no-cache
   ```

### Debug Mode

Enable debug logging:
```bash
# Set environment variable
export SPRING_PROFILES_ACTIVE=docker,debug
docker-compose up -d
```

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker exec stasis-postgres pg_dump -U postgres stasis > backup.sql

# Restore backup
docker exec -i stasis-postgres psql -U postgres stasis < backup.sql
```

### Volume Backup

```bash
# Backup database volume
docker run --rm -v stasis_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/db_backup.tar.gz /data
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy STASIS
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          ./deploy.sh prod
```

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Docker logs: `docker-compose logs`
3. Check system resources: `docker stats`
4. Verify configuration: `docker-compose config`

## DigitalOcean Deployment

### Prerequisites for DigitalOcean

- DigitalOcean account
- DigitalOcean CLI (`doctl`) installed locally
- SSH key added to your DigitalOcean account
- Domain name (optional, for custom domain)

### Option 1: DigitalOcean Droplet Deployment

#### 1. Create a Droplet

```bash
# Create a new Ubuntu droplet with Docker pre-installed
doctl compute droplet create stasis-app \
  --image docker-20-04 \
  --size s-2vcpu-4gb \
  --region nyc1 \
  --ssh-keys YOUR_SSH_KEY_ID \
  --tag-names stasis,production
```

Or create manually via DigitalOcean Control Panel:
- **Image**: Ubuntu 20.04 LTS with Docker
- **Size**: Basic plan, 4GB RAM, 2 vCPUs (minimum recommended)
- **Region**: Choose closest to your users
- **Authentication**: SSH keys
- **Tags**: stasis, production

#### 2. Connect to Your Droplet

```bash
# Get droplet IP
doctl compute droplet list

# SSH into droplet
ssh root@YOUR_DROPLET_IP
```

#### 3. Initial Server Setup

```bash
# Update system
apt update && apt upgrade -y

# Install Docker Compose if not present
curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create application directory
mkdir -p /opt/stasis
cd /opt/stasis

# Create non-root user for application
useradd -m -s /bin/bash stasis
usermod -aG docker stasis
```

#### 4. Deploy Application Files

```bash
# Option A: Clone from Git repository
git clone YOUR_REPOSITORY_URL .
chown -R stasis:stasis /opt/stasis

# Option B: Upload files via SCP (from local machine)
scp -r ./STASIS_new/* root@YOUR_DROPLET_IP:/opt/stasis/
ssh root@YOUR_DROPLET_IP "chown -R stasis:stasis /opt/stasis"
```

#### 5. Configure Environment

```bash
# Switch to stasis user
su - stasis
cd /opt/stasis

# Create production environment file
cp .env.example .env

# Edit environment variables
nano .env
```

**Required `.env` configuration for DigitalOcean:**
```env
# Database Configuration
POSTGRES_DB=stasis
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_very_secure_password_here

# Spring Boot Configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/stasis
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_very_secure_password_here
SPRING_PROFILES_ACTIVE=production

# DigitalOcean specific
SERVER_PORT=8080
FRONTEND_URL=http://YOUR_DROPLET_IP
```

#### 6. Deploy the Application

```bash
# Make deploy script executable
chmod +x deploy.sh

# Deploy production environment
./deploy.sh prod

# Or manually with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

#### 7. Configure Firewall

```bash
# Switch back to root
exit

# Configure UFW firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Verify firewall status
ufw status
```

#### 8. Access Your Application

- Frontend: `http://YOUR_DROPLET_IP`
- Backend API: `http://YOUR_DROPLET_IP:8080`

### Option 2: DigitalOcean App Platform Deployment

#### 1. Prepare App Spec File

Create `digitalocean-app.yaml`:

```yaml
name: stasis-app
services:
  - name: backend
    source_dir: /
    dockerfile_path: Dockerfile
    github:
      repo: YOUR_USERNAME/YOUR_REPO
      branch: main
    instance_count: 1
    instance_size_slug: basic-xxs
    http_port: 8080
    routes:
      - path: /api
    envs:
      - key: SPRING_PROFILES_ACTIVE
        value: production
      - key: SPRING_DATASOURCE_URL
        value: ${db.DATABASE_URL}
      - key: SPRING_DATASOURCE_USERNAME
        value: ${db.USERNAME}
      - key: SPRING_DATASOURCE_PASSWORD
        value: ${db.PASSWORD}
        
  - name: frontend
    source_dir: /frontend
    dockerfile_path: frontend/Dockerfile
    github:
      repo: YOUR_USERNAME/YOUR_REPO
      branch: main
    instance_count: 1
    instance_size_slug: basic-xxs
    http_port: 80
    routes:
      - path: /
    envs:
      - key: REACT_APP_API_URL
        value: ${backend.PUBLIC_URL}/api

databases:
  - name: db
    engine: PG
    version: "13"
    size_slug: db-s-1vcpu-1gb
```

#### 2. Deploy via CLI

```bash
# Install doctl if not already installed
# Deploy the app
doctl apps create --spec digitalocean-app.yaml

# Monitor deployment
doctl apps list
doctl apps logs YOUR_APP_ID --type deploy
```

#### 3. Deploy via DigitalOcean Control Panel

1. Go to DigitalOcean Control Panel
2. Click "Create" → "Apps"
3. Connect your GitHub repository
4. Select your repository and branch
5. Configure build and run commands:
   - **Backend**: Dockerfile in root directory
   - **Frontend**: Dockerfile in `frontend/` directory
6. Add PostgreSQL database
7. Configure environment variables
8. Deploy

### Option 3: DigitalOcean Kubernetes (DOKS)

#### 1. Create Kubernetes Cluster

```bash
# Create cluster
doctl kubernetes cluster create stasis-k8s \
  --region nyc1 \
  --node-pool "name=worker-pool;size=s-2vcpu-4gb;count=2;auto-scale=true;min-nodes=1;max-nodes=5"

# Get kubeconfig
doctl kubernetes cluster kubeconfig save stasis-k8s
```

#### 2. Deploy to Kubernetes

Create Kubernetes manifests in `k8s/` directory:

**`k8s/namespace.yaml`:**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: stasis
```

**`k8s/postgres.yaml`:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: stasis
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:13
        env:
        - name: POSTGRES_DB
          value: stasis
        - name: POSTGRES_USER
          value: postgres
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: stasis
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

**Deploy to cluster:**
```bash
# Apply manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n stasis
kubectl get services -n stasis
```

### Domain Configuration

#### 1. Point Domain to DigitalOcean

1. **For Droplet deployment:**
   - Create A record pointing to your droplet IP
   - Example: `stasis.yourdomain.com → YOUR_DROPLET_IP`

2. **For App Platform:**
   - Add custom domain in App Platform settings
   - Update DNS records as instructed

#### 2. SSL Certificate Setup

**For Droplet (using Let's Encrypt):**

```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d stasis.yourdomain.com

# Auto-renewal setup
crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

**Update Nginx configuration in `frontend/nginx.conf`:**
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name stasis.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/stasis.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stasis.yourdomain.com/privkey.pem;
    
    # Redirect HTTP to HTTPS
    if ($scheme != "https") {
        return 301 https://$host$request_uri;
    }
    
    # ...existing configuration...
}
```

### Monitoring and Maintenance

#### 1. Setup Monitoring

```bash
# Install monitoring tools
docker run -d \
  --name=node-exporter \
  --restart=always \
  -p 9100:9100 \
  prom/node-exporter

# Monitor application logs
docker-compose logs -f --tail=100
```

#### 2. Backup Strategy

```bash
# Create backup script
cat > /opt/stasis/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
docker exec stasis-postgres pg_dump -U postgres stasis > $BACKUP_DIR/db_backup_$DATE.sql

# Compress and upload to DigitalOcean Spaces (optional)
tar -czf $BACKUP_DIR/stasis_backup_$DATE.tar.gz $BACKUP_DIR/db_backup_$DATE.sql

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /opt/stasis/backup.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /opt/stasis/backup.sh
```

#### 3. Update Application

```bash
# Pull latest changes
cd /opt/stasis
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Troubleshooting DigitalOcean Issues

#### 1. Droplet Access Issues
```bash
# Reset droplet via console
doctl compute droplet-action reboot DROPLET_ID

# Access via console in control panel if SSH fails
```

#### 2. Performance Issues
```bash
# Check resource usage
htop
docker stats

# Resize droplet if needed
doctl compute droplet-action resize DROPLET_ID --size s-4vcpu-8gb
```

#### 3. Network Issues
```bash
# Check firewall rules
ufw status verbose

# Test connectivity
curl -I http://localhost
telnet localhost 8080
```

### Cost Optimization

- **Droplet**: Start with 2GB RAM ($12/month), upgrade as needed
- **App Platform**: Pay per usage, automatic scaling
- **Managed Database**: $15/month for basic PostgreSQL
- **Load Balancer**: $12/month (for high availability)
- **Monitoring**: DigitalOcean Monitoring is free

### Best Practices for DigitalOcean

1. **Use DigitalOcean Spaces** for file storage and backups
2. **Enable automatic backups** for your droplet
3. **Use DigitalOcean VPC** for network isolation
4. **Set up monitoring alerts** for resource usage
5. **Use DigitalOcean Container Registry** for private images
6. **Implement log rotation** to prevent disk space issues
7. **Regular security updates** with automated patching

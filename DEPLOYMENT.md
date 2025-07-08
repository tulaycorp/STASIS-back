# STASIS Backend - Docker Deployment Guide

This guide explains how to deploy the STASIS backend API to Digital Ocean using Docker.

## Prerequisites

- Digital Ocean Droplet with Ubuntu 20.04+ or similar Linux distribution
- Root or sudo access
- Domain `api.stasis-edu.tech` pointing to your server IP
- At least 2GB RAM and 1 CPU core recommended

## Quick Start

1. **Clone the repository** to your Digital Ocean droplet:
   ```bash
   git clone <your-repo-url>
   cd STASIS-back
   ```

2. **Install Docker and Docker Compose** (if not already installed):
   ```bash
   sudo ./install-docker.sh
   ```
   
   After installation, log out and log back in, then verify:
   ```bash
   docker --version
   docker-compose --version
   ```

3. **Run the deployment script**:
   ```bash
   ./deploy.sh
   ```

## Docker Installation

If Docker is not installed on your server, use the provided installation script:

```bash
# Make the script executable
chmod +x install-docker.sh

# Run the installation (requires sudo/root)
sudo ./install-docker.sh

# Log out and log back in for group changes to take effect
exit
# SSH back into your server

# Verify installation
docker --version
docker-compose --version
```

The installation script will:
- Install Docker Engine
- Install Docker Compose
- Add your user to the docker group
- Start and enable Docker service
- Test the installation

## Manual Deployment

If you prefer to deploy manually:

1. **Build the Docker image**:
   ```bash
   docker build -t stasis-backend:latest .
   ```

2. **Start the application**:
   ```bash
   docker-compose up -d
   ```

3. **Check the application status**:
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

## Configuration

### Environment Variables

The application uses the following environment variables (configured in `docker-compose.yml`):

- `SPRING_PROFILES_ACTIVE=production` - Activates production profile
- `DATABASE_URL` - PostgreSQL connection URL (Supabase)
- `DATABASE_USERNAME` - Database username
- `DATABASE_PASSWORD` - Database password
- `PORT=8080` - Application port

### CORS Configuration

The application is configured to accept requests from:
- `http://139.59.100.105` and `https://139.59.100.105`
- `http://api.stasis-edu.tech` and `https://api.stasis-edu.tech`
- `http://stasis-edu.tech` and `https://stasis-edu.tech`

## API Endpoints

Once deployed, the API will be available at:

- **Base URL**: `http://your-server-ip:8080` or `http://api.stasis-edu.tech:8080`
- **Health Check**: `/actuator/health`
- **Application Info**: `/actuator/info`
- **API Endpoints**: `/api/*`

## SSL/HTTPS Setup (Recommended)

For production, set up SSL/HTTPS using nginx as a reverse proxy:

1. **Install nginx**:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. **Create nginx configuration** (`/etc/nginx/sites-available/stasis-api`):
   ```nginx
   server {
       listen 80;
       server_name api.stasis-edu.tech;
       
       location / {
           proxy_pass http://localhost:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Enable the site**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/stasis-api /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Install SSL certificate with Let's Encrypt**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.stasis-edu.tech
   ```

## Monitoring and Maintenance

### View Application Logs
```bash
docker-compose logs -f stasis-backend
```

### Restart the Application
```bash
docker-compose restart
```

### Update the Application
```bash
git pull
docker-compose down
docker build -t stasis-backend:latest .
docker-compose up -d
```

### Backup Database
Since you're using Supabase, backups are handled by Supabase. However, you can create manual backups:
```bash
# This would require database access credentials
pg_dump "your-supabase-connection-string" > backup.sql
```

## Troubleshooting

### Application Won't Start
1. Check logs: `docker-compose logs stasis-backend`
2. Verify database connectivity
3. Check if port 8080 is available: `sudo netstat -tlnp | grep 8080`

### Database Connection Issues
1. Verify Supabase credentials in `docker-compose.yml`
2. Check network connectivity to Supabase
3. Ensure SSL is properly configured

### CORS Issues
1. Verify the domain is correctly configured in `SecurityConfig.java`
2. Check that the frontend is making requests to the correct URL
3. Ensure both HTTP and HTTPS variants are included if needed

## Security Considerations

1. **Firewall**: Configure UFW or iptables to only allow necessary ports
2. **SSL**: Always use HTTPS in production
3. **Database**: Use environment variables for sensitive data
4. **Updates**: Keep Docker images and system packages updated
5. **Monitoring**: Set up log monitoring and alerting

## Performance Optimization

1. **Resource Limits**: Configure Docker resource limits in `docker-compose.yml`
2. **JVM Tuning**: Add JVM options to the Dockerfile if needed
3. **Database Pool**: Adjust connection pool settings in application properties
4. **Caching**: Consider adding Redis for session storage and caching

## Support

For issues related to:
- **Application**: Check application logs and Spring Boot documentation
- **Docker**: Refer to Docker documentation
- **Digital Ocean**: Check Digital Ocean community guides
- **Database**: Refer to Supabase documentation

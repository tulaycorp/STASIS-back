# STASIS Backend - Production Deployment Setup

This repository contains a complete production deployment setup for the STASIS backend application with SSL support for Digital Ocean droplets.

## 🚀 Quick Start

### For Production Deployment

1. **Set up Digital Ocean droplet** (Ubuntu 20.04+)
2. **Point your domain** `api.stasis-edu.tech` to the droplet IP
3. **Clone this repository** on the droplet
4. **Run deployment scripts**:
   ```bash
   # Make scripts executable (on Linux server)
   chmod +x scripts/*.sh
   
   # Deploy the application
   ./scripts/deploy.sh
   
   # Set up SSL certificates
   ./scripts/init-ssl.sh
   ```

### For Local Testing

```bash
# Test the deployment setup locally
./scripts/test-deployment.sh
```

## 📁 Project Structure

```
STASIS-back/
├── src/                                    # Spring Boot application source
├── Dockerfile                              # Production Docker configuration
├── docker-compose.yml                      # Development compose file
├── docker-compose.prod.yml                 # Production compose file
├── nginx/                                  # Nginx configuration
│   ├── nginx.conf                          # Main nginx config
│   └── conf.d/
│       └── api.stasis-edu.tech.conf        # API server config
├── scripts/                                # Deployment scripts
│   ├── deploy.sh                           # Main deployment script
│   ├── init-ssl.sh                         # SSL certificate setup
│   └── test-deployment.sh                  # Local testing script
├── src/main/resources/
│   ├── application-prod.properties         # Production configuration
│   └── application-supabase.properties     # Development configuration
├── .env.example                            # Environment variables template
├── DEPLOYMENT.md                           # Detailed deployment guide
└── README.md                               # This file
```

## 🔧 Configuration Files

### Application Profiles

- **Development**: `application-supabase.properties` - Full logging, development settings
- **Production**: `application-prod.properties` - Optimized for production, minimal logging

### Docker Configuration

- **Dockerfile**: Updated to Java 17, security hardened, health checks
- **docker-compose.prod.yml**: Production setup with nginx, SSL, monitoring

### Nginx Configuration

- **SSL termination** with Let's Encrypt certificates
- **Rate limiting** for API endpoints
- **Security headers** and CORS configuration
- **Reverse proxy** to Spring Boot application

## 🛡️ Security Features

- ✅ **SSL/TLS encryption** with automatic certificate renewal
- ✅ **Security headers** (HSTS, CSP, X-Frame-Options, etc.)
- ✅ **Rate limiting** for API endpoints
- ✅ **Non-root Docker containers**
- ✅ **CORS configuration** for frontend domains
- ✅ **Firewall configuration** guidelines

## 📊 Monitoring & Health Checks

- **Health endpoint**: `/actuator/health`
- **Metrics endpoint**: `/actuator/metrics`
- **Application info**: `/actuator/info`
- **Docker health checks** with automatic restarts
- **Nginx access/error logs**

## 🌐 Domain Configuration

The setup is configured for:
- **Backend API**: `api.stasis-edu.tech`
- **Frontend**: `stasis-edu.tech`

Update the following files if using different domains:
- `nginx/conf.d/api.stasis-edu.tech.conf`
- `src/main/java/com/stasis/stasis/config/SecurityConfig.java`
- `scripts/init-ssl.sh`

## 📋 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ (recommended)
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 25GB minimum, 50GB recommended
- **Network**: Ports 80, 443, 22 open

### Software Requirements
- Docker & Docker Compose
- Java 17 (for building)
- Git

## 🚀 Deployment Steps

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Java 17
sudo apt install openjdk-17-jdk maven -y
```

### 2. Application Deployment
```bash
# Clone repository
git clone https://github.com/tulaycorp/STASIS-back.git
cd STASIS-back

# Configure environment
cp .env.example .env
nano .env  # Update with your values

# Make scripts executable
chmod +x scripts/*.sh

# Deploy application
./scripts/deploy.sh
```

### 3. SSL Setup
```bash
# Set up SSL certificates
./scripts/init-ssl.sh
```

## 🔍 Testing

### Health Checks
```bash
# Application health
curl https://api.stasis-edu.tech/actuator/health

# SSL certificate
curl -I https://api.stasis-edu.tech

# CORS test
curl -H "Origin: https://stasis-edu.tech" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://api.stasis-edu.tech/api/auth/login
```

### Local Testing
```bash
# Test deployment setup
./scripts/test-deployment.sh

# Test with development profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=supabase
```

## 🛠️ Management Commands

```bash
# View application status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart application
docker-compose -f docker-compose.prod.yml restart

# Update application
git pull
./scripts/deploy.sh

# Renew SSL certificates
docker-compose -f docker-compose.prod.yml exec certbot certbot renew
```

## 🔧 Troubleshooting

### Common Issues

1. **Port 8080 already in use**
   ```bash
   sudo netstat -tulpn | grep :8080
   sudo kill -9 <PID>
   ```

2. **SSL certificate issues**
   ```bash
   # Check certificate status
   docker-compose -f docker-compose.prod.yml exec certbot certbot certificates
   
   # Test certificate renewal
   docker-compose -f docker-compose.prod.yml exec certbot certbot renew --dry-run
   ```

3. **Database connection issues**
   - Verify database credentials in `.env`
   - Check network connectivity to Supabase
   - Review application logs

4. **CORS issues**
   - Verify domain configuration in `SecurityConfig.java`
   - Check nginx CORS headers
   - Test with browser developer tools

### Log Locations
- **Application logs**: `docker-compose -f docker-compose.prod.yml logs stasisback`
- **Nginx logs**: `docker-compose -f docker-compose.prod.yml logs nginx`
- **SSL logs**: `docker-compose -f docker-compose.prod.yml logs certbot`

## 📚 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)**: Detailed deployment guide
- **[.env.example](.env.example)**: Environment configuration template
- **Spring Boot Documentation**: https://spring.io/projects/spring-boot
- **Docker Documentation**: https://docs.docker.com/
- **Let's Encrypt Documentation**: https://letsencrypt.org/docs/

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `./scripts/test-deployment.sh`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review application logs
3. Consult the detailed deployment guide
4. Create an issue in the repository

---

**🎉 Ready for production deployment!** Follow the steps above to deploy your STASIS backend with SSL on Digital Ocean.

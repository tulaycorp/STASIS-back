# STASIS Backend - Quick Start Guide

Follow these exact steps to deploy your STASIS backend on Digital Ocean:

## Step 1: Install Docker (Run this first!)

```bash
# Make the Docker installation script executable
chmod +x install-docker.sh

# Install Docker and Docker Compose (requires sudo)
sudo ./install-docker.sh

# Log out and log back in for group changes to take effect
exit
```

After logging back in, verify Docker is working:

```bash
docker --version
docker-compose --version
```

## Step 2: Deploy the Application

```bash
# Run the deployment script
./deploy.sh
```

## Step 3: Set Up SSL/HTTPS (Recommended for Production)

```bash
# Run the SSL setup script (requires sudo)
sudo ./setup-ssl.sh
```

This will:
- Install and configure nginx as a reverse proxy
- Obtain SSL certificate from Let's Encrypt
- Set up automatic certificate renewal
- Configure security headers and gzip compression
- Redirect all HTTP traffic to HTTPS

## Step 4: Configure Firewall (Optional but Recommended)

```bash
# Enable firewall
sudo ufw enable

# Allow SSH (important - don't lock yourself out!)
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow your application port
sudo ufw allow 8080

# Check firewall status
sudo ufw status
```

## Step 5: Test Your Deployment

```bash
# Check if the application is running
curl http://localhost:8080/actuator/health

# View application logs
docker-compose logs -f stasis-backend
```

## Step 6: Access Your API

Your API will be available at:
- `https://api.stasis-edu.tech` (with SSL - recommended)
- `http://139.59.100.105:8080` (direct server access)

### Important Endpoints:
- Health Check: `https://api.stasis-edu.tech/actuator/health`
- API Base: `https://api.stasis-edu.tech/api/`
- Authentication: `https://api.stasis-edu.tech/api/auth/`

**Note:** After SSL setup, all HTTP traffic is automatically redirected to HTTPS.

## Troubleshooting

If something goes wrong:

1. **Check Docker status:**
   ```bash
   docker ps
   docker-compose ps
   ```

2. **View logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Restart the application:**
   ```bash
   docker-compose restart
   ```

4. **Rebuild and restart:**
   ```bash
   docker-compose down
   docker build -t stasis-backend:latest .
   docker-compose up -d
   ```

## Next Steps (Optional)

1. **Set up SSL with nginx** (see DEPLOYMENT.md for detailed instructions)
2. **Configure domain DNS** to point api.stasis-edu.tech to your server
3. **Set up monitoring and backups**

---

**Need help?** Check the detailed DEPLOYMENT.md file for more information.

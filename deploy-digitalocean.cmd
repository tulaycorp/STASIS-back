@echo off
REM STASIS DigitalOcean Deployment Script for Windows
REM Usage: deploy-digitalocean.cmd [droplet|app-platform|k8s] [setup|deploy|update]

setlocal enabledelayedexpansion

REM Configuration
set "DROPLET_NAME=stasis-app"
set "DROPLET_SIZE=s-2vcpu-4gb"
set "DROPLET_REGION=nyc1"
set "DROPLET_IMAGE=docker-20-04"
set "APP_NAME=stasis-app"
set "K8S_CLUSTER_NAME=stasis-k8s"

REM Check if correct number of arguments
if "%~2"=="" (
    echo Usage: %0 [droplet^|app-platform^|k8s] [setup^|deploy^|update]
    echo.
    echo Examples:
    echo   %0 droplet setup    # Create and setup droplet
    echo   %0 droplet deploy   # Deploy app to existing droplet
    echo   %0 droplet update   # Update app on droplet
    echo   %0 app-platform deploy  # Deploy to App Platform
    echo   %0 k8s deploy       # Deploy to Kubernetes
    exit /b 1
)

set "DEPLOYMENT_TYPE=%~1"
set "ACTION=%~2"

echo [INFO] Checking dependencies...

REM Check if doctl is installed
doctl version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] doctl CLI is not installed. Please install it first.
    echo Visit: https://docs.digitalocean.com/reference/doctl/how-to/install/
    exit /b 1
)

REM Check if docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker first.
    exit /b 1
)

REM Check if docker-compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed. Please install it first.
    exit /b 1
)

REM Check if user is authenticated with doctl
doctl account get >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Not authenticated with DigitalOcean. Run: doctl auth init
    exit /b 1
)

echo [SUCCESS] All dependencies are available

REM Process deployment type and action
if /i "%DEPLOYMENT_TYPE%"=="droplet" (
    if /i "%ACTION%"=="setup" (
        call :create_droplet
        call :setup_droplet
    ) else if /i "%ACTION%"=="deploy" (
        call :deploy_to_droplet
    ) else if /i "%ACTION%"=="update" (
        call :deploy_to_droplet
    ) else (
        echo [ERROR] Unknown action for droplet: %ACTION%
        exit /b 1
    )
) else if /i "%DEPLOYMENT_TYPE%"=="app-platform" (
    if /i "%ACTION%"=="deploy" (
        call :deploy_app_platform
    ) else if /i "%ACTION%"=="setup" (
        call :deploy_app_platform
    ) else if /i "%ACTION%"=="update" (
        echo [INFO] App Platform will update automatically from your Git repository
    ) else (
        echo [ERROR] Unknown action for app-platform: %ACTION%
        exit /b 1
    )
) else if /i "%DEPLOYMENT_TYPE%"=="k8s" (
    if /i "%ACTION%"=="deploy" (
        call :deploy_k8s
    ) else if /i "%ACTION%"=="setup" (
        call :deploy_k8s
    ) else if /i "%ACTION%"=="update" (
        call :update_k8s
    ) else (
        echo [ERROR] Unknown action for k8s: %ACTION%
        exit /b 1
    )
) else (
    echo [ERROR] Unknown deployment type: %DEPLOYMENT_TYPE%
    echo Supported types: droplet, app-platform, k8s
    exit /b 1
)

echo [SUCCESS] Deployment process completed!
exit /b 0

:create_droplet
echo [INFO] Creating DigitalOcean droplet...

REM Get SSH keys
echo [INFO] Available SSH keys:
doctl compute ssh-key list --format ID,Name --no-header
echo.
set /p SSH_KEY_ID="Enter SSH Key ID: "

if "%SSH_KEY_ID%"=="" (
    echo [ERROR] SSH Key ID is required
    exit /b 1
)

REM Check if droplet already exists
for /f "tokens=*" %%i in ('doctl compute droplet list --format Name --no-header') do (
    if "%%i"=="%DROPLET_NAME%" (
        echo [WARNING] Droplet '%DROPLET_NAME%' already exists
        for /f "tokens=2" %%j in ('doctl compute droplet list --format Name,PublicIPv4 --no-header ^| findstr "^%DROPLET_NAME%"') do (
            set "DROPLET_IP=%%j"
        )
        echo [INFO] Existing droplet IP: !DROPLET_IP!
        exit /b 0
    )
)

REM Create droplet
doctl compute droplet create %DROPLET_NAME% --image %DROPLET_IMAGE% --size %DROPLET_SIZE% --region %DROPLET_REGION% --ssh-keys %SSH_KEY_ID% --tag-names stasis,production --wait

REM Get droplet IP
for /f "tokens=2" %%i in ('doctl compute droplet list --format Name,PublicIPv4 --no-header ^| findstr "^%DROPLET_NAME%"') do (
    set "DROPLET_IP=%%i"
)

echo [SUCCESS] Droplet created successfully
echo [INFO] Droplet IP: %DROPLET_IP%
echo [INFO] Waiting for droplet to be ready...
timeout /t 30 /nobreak >nul

exit /b 0

:setup_droplet
if "%DROPLET_IP%"=="" (
    for /f "tokens=2" %%i in ('doctl compute droplet list --format Name,PublicIPv4 --no-header ^| findstr "^%DROPLET_NAME%"') do (
        set "DROPLET_IP=%%i"
    )
)

if "%DROPLET_IP%"=="" (
    echo [ERROR] Could not find droplet IP. Please create droplet first.
    exit /b 1
)

echo [INFO] Setting up droplet at %DROPLET_IP%...

REM Create setup script
echo #!/bin/bash > setup_server.sh
echo set -e >> setup_server.sh
echo. >> setup_server.sh
echo # Update system >> setup_server.sh
echo apt update ^&^& apt upgrade -y >> setup_server.sh
echo. >> setup_server.sh
echo # Install additional tools >> setup_server.sh
echo apt install -y curl wget git htop ufw >> setup_server.sh
echo. >> setup_server.sh
echo # Install Docker Compose if not present >> setup_server.sh
echo if ! command -v docker-compose ^&^> /dev/null; then >> setup_server.sh
echo     curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s^)-$(uname -m^)" -o /usr/local/bin/docker-compose >> setup_server.sh
echo     chmod +x /usr/local/bin/docker-compose >> setup_server.sh
echo fi >> setup_server.sh
echo. >> setup_server.sh
echo # Create application directory >> setup_server.sh
echo mkdir -p /opt/stasis >> setup_server.sh
echo cd /opt/stasis >> setup_server.sh
echo. >> setup_server.sh
echo # Create stasis user >> setup_server.sh
echo if ! id "stasis" ^&^>/dev/null; then >> setup_server.sh
echo     useradd -m -s /bin/bash stasis >> setup_server.sh
echo     usermod -aG docker stasis >> setup_server.sh
echo fi >> setup_server.sh
echo. >> setup_server.sh
echo # Configure firewall >> setup_server.sh
echo ufw allow OpenSSH >> setup_server.sh
echo ufw allow 80/tcp >> setup_server.sh
echo ufw allow 443/tcp >> setup_server.sh
echo ufw --force enable >> setup_server.sh
echo. >> setup_server.sh
echo echo "Server setup completed" >> setup_server.sh

REM Note: For Windows, you'll need to use a tool like PuTTY's pscp and plink
REM or have WSL/Git Bash installed to use scp and ssh commands
echo [INFO] Please manually copy setup_server.sh to your droplet and run it.
echo [INFO] Or use WSL/Git Bash to run the following commands:
echo   scp -o StrictHostKeyChecking=no setup_server.sh root@%DROPLET_IP%:/tmp/
echo   ssh -o StrictHostKeyChecking=no root@%DROPLET_IP% "chmod +x /tmp/setup_server.sh && /tmp/setup_server.sh"

echo [SUCCESS] Setup script created. Please run it on your droplet.
exit /b 0

:deploy_to_droplet
if "%DROPLET_IP%"=="" (
    for /f "tokens=2" %%i in ('doctl compute droplet list --format Name,PublicIPv4 --no-header ^| findstr "^%DROPLET_NAME%"') do (
        set "DROPLET_IP=%%i"
    )
)

if "%DROPLET_IP%"=="" (
    echo [ERROR] Could not find droplet IP. Please create droplet first.
    exit /b 1
)

echo [INFO] Deploying application to droplet at %DROPLET_IP%...

REM Create deployment package (requires tar command - available in Git Bash or WSL)
echo [INFO] Creating deployment package...
tar --exclude=target --exclude=node_modules --exclude=.git --exclude=frontend/build -czf stasis-deploy.tar.gz .

echo [INFO] Please manually upload stasis-deploy.tar.gz to your droplet at /opt/stasis/
echo [INFO] Then run the following commands on your droplet:
echo   cd /opt/stasis
echo   tar -xzf stasis-deploy.tar.gz
echo   chown -R stasis:stasis /opt/stasis
echo   rm stasis-deploy.tar.gz
echo   su - stasis -c "cd /opt/stasis && cp .env.example .env && chmod +x deploy.sh && ./deploy.sh prod"

echo [INFO] Frontend will be available at: http://%DROPLET_IP%
echo [INFO] Backend will be available at: http://%DROPLET_IP%:8080
echo [WARNING] Please configure /opt/stasis/.env with your database credentials

exit /b 0

:deploy_app_platform
echo [INFO] Deploying to DigitalOcean App Platform...

if not exist "digitalocean-app.yaml" (
    echo [INFO] Creating App Platform specification...
    (
        echo name: stasis-app
        echo services:
        echo   - name: backend
        echo     source_dir: /
        echo     dockerfile_path: Dockerfile
        echo     instance_count: 1
        echo     instance_size_slug: basic-xxs
        echo     http_port: 8080
        echo     routes:
        echo       - path: /api
        echo     envs:
        echo       - key: SPRING_PROFILES_ACTIVE
        echo         value: production
        echo       - key: SPRING_DATASOURCE_URL
        echo         value: ${db.DATABASE_URL}
        echo       - key: SPRING_DATASOURCE_USERNAME
        echo         value: ${db.USERNAME}
        echo       - key: SPRING_DATASOURCE_PASSWORD
        echo         value: ${db.PASSWORD}
        echo.        
        echo   - name: frontend
        echo     source_dir: /frontend
        echo     dockerfile_path: frontend/Dockerfile
        echo     instance_count: 1
        echo     instance_size_slug: basic-xxs
        echo     http_port: 80
        echo     routes:
        echo       - path: /
        echo     envs:
        echo       - key: REACT_APP_API_URL
        echo         value: ${backend.PUBLIC_URL}/api
        echo.
        echo databases:
        echo   - name: db
        echo     engine: PG
        echo     version: "13"
        echo     size_slug: db-s-1vcpu-1gb
    ) > digitalocean-app.yaml
    echo [SUCCESS] App specification created: digitalocean-app.yaml
)

REM Deploy the app
doctl apps create --spec digitalocean-app.yaml

echo [SUCCESS] App Platform deployment initiated
echo [INFO] Check deployment status: doctl apps list

exit /b 0

:deploy_k8s
echo [INFO] Deploying to DigitalOcean Kubernetes...

REM Check if cluster exists
for /f "tokens=*" %%i in ('doctl kubernetes cluster list --format Name --no-header') do (
    if "%%i"=="%K8S_CLUSTER_NAME%" (
        set "CLUSTER_EXISTS=true"
    )
)

if not defined CLUSTER_EXISTS (
    echo [INFO] Creating Kubernetes cluster...
    doctl kubernetes cluster create %K8S_CLUSTER_NAME% --region %DROPLET_REGION% --node-pool "name=worker-pool;size=s-2vcpu-4gb;count=2;auto-scale=true;min-nodes=1;max-nodes=5" --wait
)

REM Get kubeconfig
doctl kubernetes cluster kubeconfig save %K8S_CLUSTER_NAME%

REM Create k8s directory if it doesn't exist
if not exist "k8s" mkdir k8s

REM Create basic Kubernetes manifests
if not exist "k8s\namespace.yaml" (
    echo [INFO] Creating Kubernetes manifests...
    (
        echo apiVersion: v1
        echo kind: Namespace
        echo metadata:
        echo   name: stasis
    ) > k8s\namespace.yaml
    echo [SUCCESS] Kubernetes manifests created in k8s\ directory
)

REM Deploy to cluster
kubectl apply -f k8s/

echo [SUCCESS] Deployed to Kubernetes cluster
echo [INFO] Check status: kubectl get pods -n stasis

exit /b 0

:update_k8s
echo [INFO] Updating Kubernetes deployment...
kubectl apply -f k8s/
kubectl rollout restart deployment -n stasis
echo [SUCCESS] Kubernetes deployment updated
exit /b 0

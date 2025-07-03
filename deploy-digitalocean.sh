#!/bin/bash

# STASIS DigitalOcean Deployment Script
# Usage: ./deploy-digitalocean.sh [droplet|app-platform|k8s] [setup|deploy|update]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DROPLET_NAME="stasis-app"
DROPLET_SIZE="s-2vcpu-4gb"
DROPLET_REGION="nyc1"
DROPLET_IMAGE="docker-20-04"
APP_NAME="stasis-app"
K8S_CLUSTER_NAME="stasis-k8s"

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

# Check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v doctl &> /dev/null; then
        print_error "doctl CLI is not installed. Please install it first."
        echo "Visit: https://docs.digitalocean.com/reference/doctl/how-to/install/"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install it first."
        exit 1
    fi
    
    # Check if user is authenticated with doctl
    if ! doctl account get &> /dev/null; then
        print_error "Not authenticated with DigitalOcean. Run: doctl auth init"
        exit 1
    fi
    
    print_success "All dependencies are available"
}

# Get user's SSH key ID
get_ssh_key_id() {
    local ssh_keys=$(doctl compute ssh-key list --format ID,Name --no-header)
    
    if [ -z "$ssh_keys" ]; then
        print_error "No SSH keys found in your DigitalOcean account."
        print_status "Please add an SSH key first: doctl compute ssh-key import"
        exit 1
    fi
    
    echo "$ssh_keys"
    echo ""
    read -p "Enter SSH Key ID: " SSH_KEY_ID
    
    if [ -z "$SSH_KEY_ID" ]; then
        print_error "SSH Key ID is required"
        exit 1
    fi
}

# Droplet deployment functions
create_droplet() {
    print_status "Creating DigitalOcean droplet..."
    
    get_ssh_key_id
    
    # Check if droplet already exists
    if doctl compute droplet list --format Name --no-header | grep -q "^${DROPLET_NAME}$"; then
        print_warning "Droplet '${DROPLET_NAME}' already exists"
        DROPLET_IP=$(doctl compute droplet list --format Name,PublicIPv4 --no-header | grep "^${DROPLET_NAME}" | awk '{print $2}')
        print_status "Existing droplet IP: $DROPLET_IP"
        return
    fi
    
    # Create droplet
    doctl compute droplet create $DROPLET_NAME \
        --image $DROPLET_IMAGE \
        --size $DROPLET_SIZE \
        --region $DROPLET_REGION \
        --ssh-keys $SSH_KEY_ID \
        --tag-names stasis,production \
        --wait
    
    # Get droplet IP
    DROPLET_IP=$(doctl compute droplet list --format Name,PublicIPv4 --no-header | grep "^${DROPLET_NAME}" | awk '{print $2}')
    
    print_success "Droplet created successfully"
    print_status "Droplet IP: $DROPLET_IP"
    print_status "Waiting for droplet to be ready..."
    sleep 30
}

setup_droplet() {
    if [ -z "$DROPLET_IP" ]; then
        DROPLET_IP=$(doctl compute droplet list --format Name,PublicIPv4 --no-header | grep "^${DROPLET_NAME}" | awk '{print $2}')
    fi
    
    if [ -z "$DROPLET_IP" ]; then
        print_error "Could not find droplet IP. Please create droplet first."
        exit 1
    fi
    
    print_status "Setting up droplet at $DROPLET_IP..."
    
    # Wait for SSH to be available
    print_status "Waiting for SSH to be available..."
    while ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@$DROPLET_IP "echo 'SSH Ready'" 2>/dev/null; do
        sleep 5
        echo -n "."
    done
    echo ""
    
    # Setup script
    cat > setup_server.sh << 'EOF'
#!/bin/bash
set -e

# Update system
apt update && apt upgrade -y

# Install additional tools
apt install -y curl wget git htop ufw

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Create application directory
mkdir -p /opt/stasis
cd /opt/stasis

# Create stasis user
if ! id "stasis" &>/dev/null; then
    useradd -m -s /bin/bash stasis
    usermod -aG docker stasis
fi

# Configure firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "Server setup completed"
EOF

    # Copy and run setup script
    scp -o StrictHostKeyChecking=no setup_server.sh root@$DROPLET_IP:/tmp/
    ssh -o StrictHostKeyChecking=no root@$DROPLET_IP "chmod +x /tmp/setup_server.sh && /tmp/setup_server.sh"
    
    print_success "Droplet setup completed"
}

deploy_to_droplet() {
    if [ -z "$DROPLET_IP" ]; then
        DROPLET_IP=$(doctl compute droplet list --format Name,PublicIPv4 --no-header | grep "^${DROPLET_NAME}" | awk '{print $2}')
    fi
    
    if [ -z "$DROPLET_IP" ]; then
        print_error "Could not find droplet IP. Please create droplet first."
        exit 1
    fi
    
    print_status "Deploying application to droplet at $DROPLET_IP..."
    
    # Create deployment package
    print_status "Creating deployment package..."
    tar --exclude='target' --exclude='node_modules' --exclude='.git' --exclude='frontend/build' -czf stasis-deploy.tar.gz .
    
    # Upload files
    print_status "Uploading application files..."
    scp -o StrictHostKeyChecking=no stasis-deploy.tar.gz root@$DROPLET_IP:/opt/stasis/
    
    # Extract and setup on server
    ssh -o StrictHostKeyChecking=no root@$DROPLET_IP << 'EOF'
cd /opt/stasis
tar -xzf stasis-deploy.tar.gz
chown -R stasis:stasis /opt/stasis
rm stasis-deploy.tar.gz

# Switch to stasis user and deploy
su - stasis -c "
cd /opt/stasis
if [ ! -f .env ]; then
    cp .env.example .env
    echo 'Please edit /opt/stasis/.env with your configuration'
fi
chmod +x deploy.sh
./deploy.sh prod
"
EOF

    # Cleanup
    rm stasis-deploy.tar.gz
    
    print_success "Application deployed successfully"
    print_status "Frontend: http://$DROPLET_IP"
    print_status "Backend: http://$DROPLET_IP:8080"
    print_warning "Please configure /opt/stasis/.env with your database credentials"
}

# App Platform deployment
deploy_app_platform() {
    print_status "Deploying to DigitalOcean App Platform..."
    
    if [ ! -f "digitalocean-app.yaml" ]; then
        print_status "Creating App Platform specification..."
        cat > digitalocean-app.yaml << 'EOF'
name: stasis-app
services:
  - name: backend
    source_dir: /
    dockerfile_path: Dockerfile
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
EOF
        print_success "App specification created: digitalocean-app.yaml"
    fi
    
    # Deploy the app
    doctl apps create --spec digitalocean-app.yaml
    
    print_success "App Platform deployment initiated"
    print_status "Check deployment status: doctl apps list"
}

# Kubernetes deployment
deploy_k8s() {
    print_status "Deploying to DigitalOcean Kubernetes..."
    
    # Check if cluster exists
    if ! doctl kubernetes cluster list --format Name --no-header | grep -q "^${K8S_CLUSTER_NAME}$"; then
        print_status "Creating Kubernetes cluster..."
        doctl kubernetes cluster create $K8S_CLUSTER_NAME \
            --region $DROPLET_REGION \
            --node-pool "name=worker-pool;size=s-2vcpu-4gb;count=2;auto-scale=true;min-nodes=1;max-nodes=5" \
            --wait
    fi
    
    # Get kubeconfig
    doctl kubernetes cluster kubeconfig save $K8S_CLUSTER_NAME
    
    # Create k8s directory if it doesn't exist
    mkdir -p k8s
    
    # Create basic Kubernetes manifests
    if [ ! -f "k8s/namespace.yaml" ]; then
        print_status "Creating Kubernetes manifests..."
        
        cat > k8s/namespace.yaml << 'EOF'
apiVersion: v1
kind: Namespace
metadata:
  name: stasis
EOF
        
        # Add other manifests here...
        print_success "Kubernetes manifests created in k8s/ directory"
    fi
    
    # Deploy to cluster
    kubectl apply -f k8s/
    
    print_success "Deployed to Kubernetes cluster"
    print_status "Check status: kubectl get pods -n stasis"
}

# Update deployment
update_deployment() {
    local deployment_type=$1
    
    case $deployment_type in
        "droplet")
            deploy_to_droplet
            ;;
        "app-platform")
            print_status "Updating App Platform deployment..."
            # App Platform updates automatically from Git
            print_status "App Platform will update automatically from your Git repository"
            ;;
        "k8s")
            print_status "Updating Kubernetes deployment..."
            kubectl apply -f k8s/
            kubectl rollout restart deployment -n stasis
            ;;
        *)
            print_error "Unknown deployment type: $deployment_type"
            exit 1
            ;;
    esac
}

# Main function
main() {
    local deployment_type=$1
    local action=$2
    
    if [ $# -lt 2 ]; then
        echo "Usage: $0 [droplet|app-platform|k8s] [setup|deploy|update]"
        echo ""
        echo "Examples:"
        echo "  $0 droplet setup    # Create and setup droplet"
        echo "  $0 droplet deploy   # Deploy app to existing droplet"
        echo "  $0 droplet update   # Update app on droplet"
        echo "  $0 app-platform deploy  # Deploy to App Platform"
        echo "  $0 k8s deploy       # Deploy to Kubernetes"
        exit 1
    fi
    
    check_dependencies
    
    case $deployment_type in
        "droplet")
            case $action in
                "setup")
                    create_droplet
                    setup_droplet
                    ;;
                "deploy")
                    deploy_to_droplet
                    ;;
                "update")
                    update_deployment "droplet"
                    ;;
                *)
                    print_error "Unknown action for droplet: $action"
                    exit 1
                    ;;
            esac
            ;;
        "app-platform")
            case $action in
                "deploy"|"setup")
                    deploy_app_platform
                    ;;
                "update")
                    update_deployment "app-platform"
                    ;;
                *)
                    print_error "Unknown action for app-platform: $action"
                    exit 1
                    ;;
            esac
            ;;
        "k8s")
            case $action in
                "deploy"|"setup")
                    deploy_k8s
                    ;;
                "update")
                    update_deployment "k8s"
                    ;;
                *)
                    print_error "Unknown action for k8s: $action"
                    exit 1
                    ;;
            esac
            ;;
        *)
            print_error "Unknown deployment type: $deployment_type"
            echo "Supported types: droplet, app-platform, k8s"
            exit 1
            ;;
    esac
    
    print_success "Deployment process completed!"
}

# Run main function
main "$@"

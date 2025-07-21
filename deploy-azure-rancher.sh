#!/bin/bash

# Angular SSO Test - Azure Rancher Deployment Script
# This script builds and deploys the Angular application to Rancher on Azure

set -e

# Configuration
RESOURCE_GROUP="rg-rancher-sso-test"
ACR_NAME="acrssotest"
AKS_CLUSTER_NAME="aks-rancher-cluster"
LOCATION="East US"
IMAGE_NAME="sso-test"
RANCHER_URL="https://rancher.yourcompany.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    echo_info "Checking prerequisites..."
    
    if ! command_exists az; then
        echo_error "Azure CLI not found. Please install Azure CLI."
        exit 1
    fi
    
    if ! command_exists docker; then
        echo_error "Docker not found. Please install Docker."
        exit 1
    fi
    
    if ! command_exists kubectl; then
        echo_error "kubectl not found. Please install kubectl."
        exit 1
    fi
    
    if ! command_exists helm; then
        echo_error "Helm not found. Please install Helm."
        exit 1
    fi
    
    echo_info "All prerequisites satisfied."
}

# Login to Azure
azure_login() {
    echo_info "Logging into Azure..."
    az login
    az account show
}

# Create Azure Container Registry
create_acr() {
    echo_info "Creating Azure Container Registry..."
    az group create --name $RESOURCE_GROUP --location "$LOCATION"
    
    az acr create \
        --resource-group $RESOURCE_GROUP \
        --name $ACR_NAME \
        --sku Basic \
        --admin-enabled true
    
    # Get ACR login server
    ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query loginServer --output tsv)
    echo_info "ACR Login Server: $ACR_LOGIN_SERVER"
}

# Build and push Docker image
build_and_push_image() {
    echo_info "Building Angular application..."
    npm install
    npm run build
    
    echo_info "Building Docker image..."
    docker build -t $IMAGE_NAME:latest .
    
    echo_info "Logging into ACR..."
    az acr login --name $ACR_NAME
    
    echo_info "Tagging and pushing image to ACR..."
    docker tag $IMAGE_NAME:latest $ACR_LOGIN_SERVER/$IMAGE_NAME:latest
    docker push $ACR_LOGIN_SERVER/$IMAGE_NAME:latest
    
    echo_info "Image pushed successfully: $ACR_LOGIN_SERVER/$IMAGE_NAME:latest"
}

# Deploy to Rancher using Helm
deploy_to_rancher() {
    echo_info "Deploying to Rancher using Helm..."
    
    # Update Helm values with correct image repository
    sed -i.bak "s|your-registry.azurecr.io/sso-test|$ACR_LOGIN_SERVER/$IMAGE_NAME|g" helm/sso-test/values.yaml
    
    # Deploy using Helm
    helm upgrade --install sso-test helm/sso-test \
        --namespace default \
        --set image.repository=$ACR_LOGIN_SERVER/$IMAGE_NAME \
        --set image.tag=latest \
        --set ingress.hosts[0].host=sso-test.$(kubectl config current-context | cut -d'@' -f2).com
    
    echo_info "Application deployed successfully!"
    echo_info "Check Rancher dashboard at: $RANCHER_URL"
}

# Create Kubernetes secrets for ACR
create_k8s_secrets() {
    echo_info "Creating Kubernetes secrets for ACR access..."
    
    ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username --output tsv)
    ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value --output tsv)
    
    kubectl create secret docker-registry regcred \
        --docker-server=$ACR_LOGIN_SERVER \
        --docker-username=$ACR_USERNAME \
        --docker-password=$ACR_PASSWORD \
        --docker-email=your-email@company.com \
        --dry-run=client -o yaml | kubectl apply -f -
}

# Main deployment flow
main() {
    echo_info "Starting Angular SSO Test deployment to Azure Rancher..."
    
    check_prerequisites
    
    case "${1:-all}" in
        "prerequisites")
            check_prerequisites
            ;;
        "login")
            azure_login
            ;;
        "acr")
            create_acr
            ;;
        "build")
            build_and_push_image
            ;;
        "secrets")
            create_k8s_secrets
            ;;
        "deploy")
            deploy_to_rancher
            ;;
        "all")
            azure_login
            create_acr
            build_and_push_image
            create_k8s_secrets
            deploy_to_rancher
            ;;
        *)
            echo_error "Usage: $0 {prerequisites|login|acr|build|secrets|deploy|all}"
            echo_info "  prerequisites - Check if all required tools are installed"
            echo_info "  login        - Login to Azure"
            echo_info "  acr          - Create Azure Container Registry"
            echo_info "  build        - Build and push Docker image"
            echo_info "  secrets      - Create Kubernetes secrets"
            echo_info "  deploy       - Deploy to Rancher"
            echo_info "  all          - Run complete deployment (default)"
            exit 1
            ;;
    esac
    
    echo_info "Deployment completed successfully!"
}

# Run main function with all arguments
main "$@"

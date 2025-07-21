# Angular Application Deployment with Rancher on Azure

This guide walks you through deploying your Angular SSO Test application using Rancher on Azure Kubernetes Service (AKS).

## Prerequisites

### Required Tools

- **Azure CLI** (`az`) - [Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- **Docker** - [Install Docker](https://docs.docker.com/get-docker/)
- **kubectl** - [Install kubectl](https://kubernetes.io/docs/tasks/tools/)
- **Helm** - [Install Helm](https://helm.sh/docs/intro/install/)

### Azure Requirements

- Active Azure subscription
- Sufficient permissions to create resource groups, AKS clusters, and ACR

### Rancher Requirements

- Rancher server deployed on Azure (or accessible Rancher instance)
- Access to Rancher dashboard
- AKS cluster imported/managed by Rancher

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Azure Cloud                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Resource Group                           │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │ │
│  │  │      ACR        │  │      AKS        │  │   Rancher   │ │ │
│  │  │ (Container      │  │   Cluster       │  │   Server    │ │ │
│  │  │  Registry)      │  │                 │  │             │ │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Step-by-Step Deployment

### Option 1: Automated Deployment (Recommended)

Use the provided deployment script for a complete automated deployment:

```bash
# Run complete deployment
./deploy-azure-rancher.sh

# Or run individual steps
./deploy-azure-rancher.sh prerequisites  # Check prerequisites
./deploy-azure-rancher.sh login         # Login to Azure
./deploy-azure-rancher.sh acr           # Create ACR
./deploy-azure-rancher.sh build         # Build and push image
./deploy-azure-rancher.sh secrets       # Create K8s secrets
./deploy-azure-rancher.sh deploy        # Deploy to Rancher
```

### Option 2: Manual Deployment

#### Step 1: Setup Azure Resources

```bash
# Login to Azure
az login

# Create resource group
az group create --name rg-rancher-sso-test --location "East US"

# Create Azure Container Registry
az acr create \
  --resource-group rg-rancher-sso-test \
  --name acrssotest \
  --sku Basic \
  --admin-enabled true

# Create AKS cluster (if not exists)
az aks create \
  --resource-group rg-rancher-sso-test \
  --name aks-rancher-cluster \
  --node-count 3 \
  --enable-addons monitoring \
  --generate-ssh-keys \
  --attach-acr acrssotest
```

#### Step 2: Build and Push Docker Image

```bash
# Build Angular application
npm install
npm run build

# Build Docker image
docker build -t sso-test:latest .

# Login to ACR
az acr login --name acrssotest

# Tag and push image
ACR_LOGIN_SERVER=$(az acr show --name acrssotest --query loginServer --output tsv)
docker tag sso-test:latest $ACR_LOGIN_SERVER/sso-test:latest
docker push $ACR_LOGIN_SERVER/sso-test:latest
```

#### Step 3: Configure Rancher

1. **Access Rancher Dashboard**
    - Navigate to your Rancher URL
    - Login with your credentials

2. **Import/Add AKS Cluster**

    ```bash
    # Get AKS credentials
    az aks get-credentials --resource-group rg-rancher-sso-test --name aks-rancher-cluster

    # Verify cluster access
    kubectl get nodes
    ```

3. **Add Cluster to Rancher**
    - In Rancher Dashboard: Cluster Management → Import Existing
    - Follow the import instructions provided by Rancher
    - Use the generated kubectl command to register your cluster

#### Step 4: Create Kubernetes Secrets

```bash
# Create secret for ACR access
ACR_USERNAME=$(az acr credential show --name acrssotest --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name acrssotest --query passwords[0].value --output tsv)

kubectl create secret docker-registry regcred \
  --docker-server=$ACR_LOGIN_SERVER \
  --docker-username=$ACR_USERNAME \
  --docker-password=$ACR_PASSWORD \
  --docker-email=your-email@company.com
```

#### Step 5: Deploy Application

Choose one of the following deployment methods:

**Option A: Using Helm (Recommended)**

```bash
# Update values.yaml with your ACR details
helm upgrade --install sso-test helm/sso-test \
  --namespace default \
  --set image.repository=$ACR_LOGIN_SERVER/sso-test \
  --set image.tag=latest
```

**Option B: Using kubectl**

```bash
# Update deployment.yaml with your image registry
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
```

**Option C: Using Rancher Dashboard**

1. Navigate to Workloads → Deployments
2. Click "Create"
3. Select "Import YAML"
4. Paste the contents of your deployment files
5. Update image repository to your ACR
6. Deploy

## Configuration

### Environment Variables

Update `helm/sso-test/values.yaml` to add environment variables:

```yaml
env:
    - name: NODE_ENV
      value: 'production'
    - name: API_BASE_URL
      value: 'https://api.yourcompany.com'
```

### Ingress Configuration

Update ingress settings in `values.yaml`:

```yaml
ingress:
    enabled: true
    className: 'nginx'
    hosts:
        - host: sso-test.yourcompany.com
          paths:
              - path: /
                pathType: Prefix
    tls:
        - secretName: sso-test-tls
          hosts:
              - sso-test.yourcompany.com
```

### Scaling Configuration

Configure auto-scaling:

```yaml
autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 10
    targetCPUUtilizationPercentage: 80
```

## Monitoring and Maintenance

### Health Checks

The application includes health check endpoints:

- Health check: `http://your-app-url/health`
- Ready check: `http://your-app-url/health`

### Logs

View application logs:

```bash
# Via kubectl
kubectl logs -f deployment/sso-test-app

# Via Rancher Dashboard
Navigate to Workloads → Pods → Select Pod → View Logs
```

### Updates

To update the application:

```bash
# Build new image with updated tag
docker build -t sso-test:v2.0.0 .
docker tag sso-test:v2.0.0 $ACR_LOGIN_SERVER/sso-test:v2.0.0
docker push $ACR_LOGIN_SERVER/sso-test:v2.0.0

# Update Helm deployment
helm upgrade sso-test helm/sso-test \
  --set image.tag=v2.0.0
```

## Troubleshooting

### Common Issues

1. **Image Pull Errors**

    ```bash
    # Check secret exists
    kubectl get secrets regcred

    # Recreate secret if needed
    kubectl delete secret regcred
    # Run create secret command again
    ```

2. **Pod Not Starting**

    ```bash
    # Check pod status
    kubectl describe pod <pod-name>

    # Check logs
    kubectl logs <pod-name>
    ```

3. **Ingress Not Working**

    ```bash
    # Check ingress controller
    kubectl get pods -n ingress-nginx

    # Check ingress resource
    kubectl describe ingress sso-test-ingress
    ```

### Useful Commands

```bash
# Check deployment status
kubectl get deployments
kubectl get pods
kubectl get services
kubectl get ingress

# Scale deployment
kubectl scale deployment sso-test-app --replicas=5

# Port forward for testing
kubectl port-forward service/sso-test-service 8080:80

# Check resource usage
kubectl top pods
kubectl top nodes
```

## Security Best Practices

1. **Use least privilege access** for service accounts
2. **Enable RBAC** in your AKS cluster
3. **Use Azure Key Vault** for sensitive configuration
4. **Implement network policies** to restrict pod communication
5. **Regular security updates** for base images
6. **Use private endpoints** for ACR access
7. **Enable Azure Defender** for containers

## Cost Optimization

1. **Use appropriate node sizes** for your workload
2. **Enable cluster autoscaling**
3. **Use spot instances** for non-critical workloads
4. **Monitor and optimize resource requests/limits**
5. **Use Azure Cost Management** to track expenses

## Next Steps

1. Set up CI/CD pipeline with Azure DevOps or GitHub Actions
2. Implement monitoring with Azure Monitor and Application Insights
3. Configure backup and disaster recovery
4. Set up development and staging environments
5. Implement advanced security scanning

For support and updates, refer to the project documentation or contact your DevOps team.

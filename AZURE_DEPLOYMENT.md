# Azure Deployment Guide

This project is configured for deployment to Microsoft Azure cloud services.

## Prerequisites

- Azure account with active subscription
- Azure CLI installed and configured
- Node.js 18.x or higher
- Git

## Deployment Options

### Option 1: Azure App Service (Recommended)

Deploy directly to Azure App Service using the ARM template:

```bash
# Login to Azure
az login

# Create resource group
az group create --name rg-breast-cancer-awareness --location eastus

# Deploy using ARM template
az deployment group create \
  --resource-group rg-breast-cancer-awareness \
  --template-file azuredeploy.json \
  --parameters azuredeploy.parameters.json
```

### Option 2: Azure DevOps Pipeline

The project includes an Azure DevOps CI/CD pipeline (`azure-pipelines.yml`). To use it:

1. Create an Azure DevOps project
2. Import this repository
3. Configure the Azure service connection
4. Update the pipeline variables
5. Run the pipeline

### Option 3: GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/azure-webapps-deploy.yml`). To use it:

1. Add the following secrets to your GitHub repository:
   - `AZURE_WEBAPP_PUBLISH_PROFILE`
   - `AZURE_CREDENTIALS`

2. Push to the main branch to trigger deployment

### Option 4: Docker Container

Deploy as a container to Azure Container Instances or Azure Container Apps:

```bash
# Build Docker image
docker build -t breast-cancer-awareness-app .

# Tag for Azure Container Registry
docker tag breast-cancer-awareness-app <your-registry>.azurecr.io/breast-cancer-awareness-app:latest

# Push to registry
docker push <your-registry>.azurecr.io/breast-cancer-awareness-app:latest
```

## Configuration

### Environment Variables

Set the following environment variables in Azure App Service:

- `NODE_ENV`: production
- `PORT`: 3001
- `WEBSITE_NODE_DEFAULT_VERSION`: ~18

### Application Settings

The application uses the following Azure services:

- **Azure App Service**: Web hosting
- **Application Insights**: Monitoring and logging
- **Azure Storage**: File storage (if enabled)

## Monitoring

Application Insights is configured for monitoring. View metrics and logs in the Azure Portal under Application Insights.

## Troubleshooting

### Common Issues

1. **Deployment fails**: Check the deployment logs in Azure Portal
2. **Application not starting**: Verify Node.js version and environment variables
3. **Port issues**: Ensure PORT environment variable is set correctly

## Support

For Azure-specific issues, refer to:
- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Azure DevOps Documentation](https://docs.microsoft.com/azure/devops/)


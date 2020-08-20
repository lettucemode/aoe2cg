# Workflows

Here are some instructions for how get the `push-backend.yml` workflow to work in GitHub Actions in your own repository.

1. If you haven't done so already, create an Azure subscription and a new empty resource group.
2. Follow the instructions [here](https://docs.microsoft.com/en-us/azure/azure-resource-manager/templates/deploy-github-actions#configure-deployment-credentials) to create a new service principal with contribute rights on the resource group. To run the commands, you can either install the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest) or use the Cloud Shell in the Azure portal.
3. Copy the output of the `az ad sp create-for-rbac` command, create a new secret in your repository named `AZURE_SP_CREDENTIALS`, and paste in the value.
4. Create a new repository secret named `ARM_TEMPLATE_PARAMETERS`. The value should take this form, and should include all the parameters the ARM template expects:

```
{
    "$schema": "https://schema.management.azure.com/schemas/2015-01-01/deploymentParameters.json#",
    "contentVersion": "1.0.0.0",
    "parameters": {
        "parameter_one": {
            "value": "value_one"
        },
        "parameter_two": {
            "value": "value_two"
        }
    }
}
```

5. Update `AZURE_RG_NAME` in the workflow to match your resource group's name.
6. Trigger the workflow and let it run. It usually takes about 10 minutes to run the first time as it spins everything up (subsequent incremental runs take about 2 minutes). It'll also fail to deploy the function app in the second half, because you don't have the publish profile yet.
7. Go to your newly created function app in the Azure portal and download the publish profile. Create a new repository secret named `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` and copy-paste the contents in.
8. Trigger the workflow again and this time it'll all succeed.

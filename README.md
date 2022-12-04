> ** This project is no longer active as a Twitch extension and is not being maintained.** The code is still perfectly servicable, and you are free to use it per the license.

---

# Age of Empires II Community Games Twitch Extension

This is a Twitch panel extension to facilitate community games for Age of Empires II: Definitive Edition.

![Deploy ARM Template](https://github.com/lettucemode/aoe2cg/workflows/Deploy%20ARM%20Template/badge.svg)
![Build & Deploy Backend](https://github.com/lettucemode/aoe2cg/workflows/Build%20&%20Deploy%20Backend/badge.svg)

Here's some links with more information on how it works:
- [Extension discovery page on Twitch](https://dashboard.twitch.tv/extensions/9cwq8civy57ul3ir5vlodpl4v1871f)
- [Video on how it works](https://www.youtube.com/watch?v=z-CpDm-lbQw)

## Built With

- [Twitch Extensions Helper/Reference](https://dev.twitch.tv/docs/extensions/reference)
- [Azure Functions](https://azure.microsoft.com/en-us/services/functions/)
- [Azure Cosmos Db](https://azure.microsoft.com/en-us/services/cosmos-db/)
- [Bootstrap](https://getbootstrap.com/)
- [JQuery](https://jquery.com/)

## Prerequisites

For the frontend:

- Familiarize yourself with the [official Twitch Extension documentation](https://dev.twitch.tv/docs/extensions).
- Register an account with the [Twitch Developer Console](https://dev.twitch.tv/console) and create a new extension.
- Install the Twitch Developer Rig from here: https://dev.twitch.tv/docs/extensions/rig.
- Log into the rig and connect it to your newly created extension.

For the backend:

- Familiarize yourself with [Azure Functions in C# and Visual Studio Code](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-function-vs-code?pivots=programming-language-csharp). Follow the environment setup steps in that article.
- Install the [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=windows%2Ccsharp%2Cbash) via `npm install -g azure-functions-core-tools@3`.

## Development & Testing

Here's how I run and test this code on a Windows machine. Other OSs are probably similar.

### Frontend

Run the script `frontend/package-frontend.sh` to pull down the dependencies. It uses [7zip](https://www.7-zip.org/) to handle the .zip archives - feel free to modify if you use a different tool.

Follow the docs linked above to configure the Twitch Developer Rig to look for frontend files in `/frontend`, create extension views for the broadcaster and viewer panels, and run the frontend. If it's set up correctly, the Twitch helper events will fire and the rig will start calling out to the backend. `Ctrl-Shift-I` to bring up the dev tools. 

`shared.js` has a variable at the top named `localtest` which you should set to `true` to use a localhost backend url. Otherwise the extension will try to get the backend url and key from Twitch's extension configuration service. If you want to use that service, enable it in the developer console and then use the Configuration Service page in the rig to set values.

### Backend

Build the backend with:

```
cd backend
dotnet build
```

To run it, first create `backend/local.settings.json` with these contents:

```
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet",
    "ClientSecret": "twitch_extension_client_secret",
    "CosmosConnectionString": "cosmos_db_connection_string",
    "CosmosDbName": "cosmos_db_sql_name",
    "ExtensionClientId": "twitch_extension_client_id",
    "ExtensionOwnerId": "twitch_extension_owner_id",
    "ExtensionSecret": "twitch_extension_secret"
  },
  "Host": {
    "CORS": "*"
  }
}

```

You'll need fill in the missing values with your Twitch extension's keys/secrets and the database name and connection string. See the Deployments -> Backend section below for more details on what those are and how you can populate them. Once that's done, hit `F5` to start debugging locally.

## Deployment / Publishing

### Frontend

This is a somewhat manual process due to how the Twitch extension lifecycle works. Run `frontend/package-frontend.sh` then upload `frontend.zip` to the Files tab of the extension developer console page. Then change the extension's status to `Hosted Test` to see it in action on Twitch.

### Backend

You can deploy the function app to Azure by running `func azure functionapp publish <your function app name>`. In addition, there's a [GitHub Actions workflow](.github/workflows/push-backend.yml) that builds & publishes to Azure on any push to `main`.

Of course, before that will work, you need a function app resource already created in Azure - and the storage account, and the hosting plan, and the database. To make that easier, this repo includes an [ARM Template](templates/azuredeploy.json) to provision the cloud resources. You can deploy the template [via the Azure portal](https://docs.microsoft.com/en-us/azure/azure-resource-manager/templates/deploy-portal) or [via the Azure CLI](https://docs.microsoft.com/en-us/azure/azure-resource-manager/templates/deploy-cli).

You will need to provide your own values for the template parameters. Refer to the [template file](templates/azuredeploy.json) for the parameter names and descriptions. The deployment will work fine if you just use the default values, but the function app won't be able to talk to Twitch if the Twitch-related parameters aren't correct.

If you want to deploy the template with Github Actions [like this repo does](.github/workflows/deployArmTemplate.yml), you'll need to add some repository secrets. Follow these steps:

1) If you haven't done so already, create an Azure subscription and a new empty resource group.
2) Follow the instructions [here](https://docs.microsoft.com/en-us/azure/azure-resource-manager/templates/deploy-github-actions#configure-deployment-credentials) to create a new service principal with contribute rights on the resource group. To run the commands, you can either install the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest) or use the Cloud Shell in the Azure portal.
3) Copy the output of the `az ad sp create-for-rbac` command, create a new secret in your repository named `AZURE_SP_CREDENTIALS`, and paste in the value.
4) Create a new repository secret named `ARM_TEMPLATE_PARAMETERS`. The value should take this form:
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
5) Update the `AZURE_RG_NAME` variable in the [ARM workflow](.github/workflows/deployArmTemplate.yml) to match your resource group's name.
6) Trigger the workflow and let it run. It usually takes about 10 minutes to run the first time. Subsequent incremental runs take about 2 minutes.
7) Go to your newly created function app in the Azure portal and download the publish profile. Create a new repository secret named `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` and copy-paste the contents in.
8) Trigger the [Build & Deploy Backend](.github/workflows/push-backend.yml) workflow to deploy the function app.

Now you can test with the live backend running in Azure. If want to test a local frontend against it, make sure to change the CORS rule to `*` in the function app configuration - by default the template sets it to your extension's domain on `ext-twitch.tv`, which blocks requests from `localhost`. Just remember to change it back later.

## Thanks

Many thanks to the [TwitchDev Discord](https://discord.com/invite/G8UQqNy) for answering all my questions, especially BarryCarlyon#1698, Breci#1906, Dist#5867, WLG3R#4917, and Marenthyu#4211.

Thanks to [T90Official](https://www.twitch.tv/t90official) and [his community](https://discord.gg/t90official) for being cool enough to inspire me to make this.

## Support

If you've gotten some value from this project and want to support it, feel free to throw me a few bucks on [Ko-Fi](https://ko-fi.com/lettucemode/).

## License

MIT License - [LICENSE.md](LICENSE.md)

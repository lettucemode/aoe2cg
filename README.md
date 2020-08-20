# Age of Empires II Community Games Twitch Extension

This is a Twitch extension to facilitate community games for Age of Empires II: Definitive Edition.

![Backend, app + ARM](https://github.com/lettucemode/aoe2cg/workflows/Build%20&%20Deploy%20Backend/badge.svg)

How it works:

- [Extension discovery page on Twitch](https://dashboard.twitch.tv/extensions/9cwq8civy57ul3ir5vlodpl4v1871f)
- [Video explanation/tutorial](https://www.youtube.com/watch?v=z-CpDm-lbQw)

## Built With

- [Twitch Extensions Helper/Reference](https://dev.twitch.tv/docs/extensions/reference)
- [Azure Functions](https://azure.microsoft.com/en-us/services/functions/)
- [Azure Cosmos Db](https://azure.microsoft.com/en-us/services/cosmos-db/)
- [Bootstrap](https://getbootstrap.com/)
- [Angular](https://angular.io/)

## Prerequisites

### Frontend

- [Node.js](https://nodejs.org/), any reasonable version
- [Angular CLI](https://cli.angular.io) - `npm install -g @angular/cli`
- [Twitch Developer Rig](https://dev.twitch.tv/docs/extensions/rig)

### Backend

- [Visual Studio Code](https://code.visualstudio.com/)
  - plus extensions: C#, Azure Functions
- [.NET Core 3.1](https://dotnet.microsoft.com/download/dotnet-core/3.1)
- [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=windows%2Ccsharp%2Cbash) - `npm install -g azure-functions-core-tools@3`

## Development & Testing

This extension was developed and tested on a Windows 10 machine with [Git Bash](https://git-scm.com/) & related tools all on PATH. If your setup is different, then your mileage with the below may vary. But hey, if you've never spent inordinate amounts of time trying to mimic someone else's dev environment, then have you ever really lived?

### Frontend

If this is your first time learning about Twitch extensions, take some time to read over the [official Twitch Extension documentation](https://dev.twitch.tv/docs/extensions). Follow the instructions there to create a [Twitch Developer Console](https://dev.twitch.tv/console) account and a new extension.

You can get a basic setup for this extension working with a few steps. First, in the Asset Hosting tab, set the Panel Viewer Path to `#/panel`. Then log in to the rig and connect it to your newly created extension. Next, verify that the site starts correctly:

```
cd frontend
npm install && ng serve
```

Finally, config the rig to fetch frontend files from `frontend/dist/frontend/`, and add a panel view with the default settings. Switch to the Extension Views page and you should see the loading spinner appear.

### Backend

If you don't have a Visual Studio + C# + Azure Functions dev environment already, you can follow the steps in this article to get started: [Azure Functions in C# and Visual Studio Code](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-function-vs-code?pivots=programming-language-csharp).

Then build the backend with:

```
cd backend
dotnet build
```

Before you can `dotnet run`, you'll need to create `backend/local.settings.json` with these contents:

```
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "storage_account_connection_string",
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

Fill in the missing values with your Twitch extension's keys/secrets and the various Azure connection strings. See the Deployments -> Backend section below for more details on what those are and how you can populate them.

Once that's done, hit `F5` to debug. You should see something like the below, after which you can set breakpoints in the editor and all that jazz.

```
Microsoft (R) Build Engine version 16.6.0+5ff7b0c9e for .NET Core
Copyright (C) Microsoft Corporation. All rights reserved.

  Determining projects to restore...
  All projects are up-to-date for restore.
  backend -> D:\source\repos\aoe2cg\backend\bin\Debug\netcoreapp3.1\backend.dll

Terminal will be reused by tasks, press any key to close it.

> Executing task: func host start <


                  %%%%%%
                 %%%%%%
            @   %%%%%%    @
          @@   %%%%%%      @@
       @@@    %%%%%%%%%%%    @@@
     @@      %%%%%%%%%%        @@
       @@         %%%%       @@
         @@      %%%       @@
           @@    %%      @@
                %%
                %

Azure Functions Core Tools (3.0.2750 Commit hash: 623808b5796d31655e7ed35086cde6001b459ebe)
Function Runtime Version: 3.0.14191.0
```

## Deployment / Publishing

### Frontend

This is a somewhat manual process due to how Twitch manages extension lifecycles. Run `npm run-script package-for-twitch` to build the site and zip up the files. Note that the bash tool "zip" must be on your PATH. If you use a different zip utility, then modify the script command in `package.json` accordingly.

Once you have the .zip, go to Files in your Twitch Developer Console and upload it there. After that, you can switch the extension to Hosted Test and install it on your channel to see it in action.

### Backend

You can deploy the function app to Azure manually with:

```
cd backend
func azure functionapp publish <function app name>
```

Of course, before that will work, the infrastructure needs to be already created & running in Azure - the app, the storage account, the hosting plan, and you'll need the database at some point too. You could set those up manually if you really wanted. However, to make it easier, this repo includes an [ARM Template](templates/azuredeploy.json) to provision the cloud resources. You can deploy the template [via the Azure portal](https://docs.microsoft.com/en-us/azure/azure-resource-manager/templates/deploy-portal) or [via the Azure CLI](https://docs.microsoft.com/en-us/azure/azure-resource-manager/templates/deploy-cli) to spin everything up in one go - easy peasy.

You will need to provide your own values for the template parameters. Refer to the [template file](templates/azuredeploy.json) for the parameter names and descriptions. The deployment will work fine if you just use the default values, but the function app won't be able to talk to Twitch if the Twitch-related parameters aren't correct. You can get those from the Twitch Developer Console.

I'm into automating as much as I can, so there's also a [GitHub Actions workflow](.github/workflows/push-backend.yml) that builds & publishes the app and infrastructure on any push to `main`. If you want to set that up in your own repo, see the [other readme](.github/workflows/).

To test a local frontend against the backend running in Azure, make sure to change the CORS rule to `*` in the function app configuration. By default, the template sets it to your extension's domain on `ext-twitch.tv`, which means requests from `localhost` will get blocked. Just remember to change it back later.

## Thanks

Many thanks to the [TwitchDev Discord](https://discord.com/invite/G8UQqNy) for answering all my questions, especially BarryCarlyon#1698, Breci#1906, Dist#5867, WLG3R#4917, and Marenthyu#4211.

Thanks to [T90Official](https://www.twitch.tv/t90official) and [his community](https://discord.gg/t90official) for being cool enough to inspire me to make this.

## Support

If you've gotten some value from this project or the repo and want to support it, feel free to throw me a few bucks on [Ko-Fi](https://ko-fi.com/lettucemode/).

## License

MIT License - [LICENSE.md](LICENSE.md)

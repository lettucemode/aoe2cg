# aoe2cg

Twitch panel extension to facilitate community games for Age of Empires II: Definitive Edition. 

![Publish Backend](https://github.com/lettucemode/aoe2cg/workflows/Publish%20Backend/badge.svg)

## Built With

- [Twitch Extensions Helper/Reference](https://dev.twitch.tv/docs/extensions/reference)
- [Azure Functions](https://azure.microsoft.com/en-us/services/functions/)
- [Azure Cosmos Db](https://azure.microsoft.com/en-us/services/cosmos-db/)
- [Semantic UI](https://semantic-ui.com/)
- [JQuery](https://jquery.com/)

## Setting up the dev environment

Here's how to get started with this code on a Windows machine. Other OSs are probably similar.

### Backend

- Install [.NET Core SDK 3.1.201](https://dotnet.microsoft.com/download/dotnet-core/3.1)
- Install Azure Functions Core Tools v3:
```
npm install -g azure-functions-core-tools@3
```
- Install Visual Studio Code and these extensions:
  - Azure Functions
  - C#

Clone the repo and open in Visual Studio Code. To build the backend:

```
cd backend
dotnet build
```

To debug, open a new VSCode window in `/backend`, press `F5`, and verify that the console displays v3 of Azure Functions Core Tools.

```
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

Azure Functions Core Tools (3.0.2534 Commit hash: bc1e9efa8fa78dd1a138dd1ac1ebef97aac8d78e)
Function Runtime Version: 3.0.13353.0
```

### Frontend

- Go to the Twitch [Extensions Developer Console](https://dev.twitch.tv/console/extensions), sign in, and register a new extension there.
- Download and install the Twitch Extensions Developer Rig from their [developer documentation](https://dev.twitch.tv/docs/extensions/rig).
- `cd` to `/frontend` and run `package-frontend.sh` to fetch the dependencies (requires a [bash shell](https://git-scm.com/) and [7zip](https://www.7-zip.org/)).
- Run the rig, sign in with your Twitch creds, select the extension you created, and specify that the frontend is in the `/frontend` folder. 
- Use the Extension Views panel to create simulated views for the broadcaster and the viewer(s), then click `Run Frontend`. The views should initialize and start sending requests to the backend.
- Refer to the developer documentation for more details on the rig, how extensions work, and how to run the extension on your channel.

### local.settings.json

After cloning, create `backend/local.settings.json` with these contents:

```
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet",
    "ExtensionClientId": "<your twitch extension client ID>",
    "ExtensionSecret": "<your twitch extension secret>",
    "ExtensionOwnerId": "<your twitch owner ID>",
    "ClientSecret": "<a generated client secret>",
    "CosmosConnectionString": "<connection string to cosmos db>"
  },
  "Host": {
    "CORS": "*"
  }
}
```

`ExtensionClientId`, `ExtensionSecret`, and `ClientSecret` can all be found on the Twitch extension's settings page. `ExtensionOwnerId` is the numeric Twitch ID of the owner of the extension (probably you).

`CosmosConnectionString` is the connection string to your Cosmos Db account, the one that includes both `AccountEndpoint` and `AccountKey`. You can get it from the Azure portal.

## Deployments

To deploy the backend to your Azure Functions App:

```
cd backend
func azure functionapp publish <your app name here>
```

There's also a [GitHub Actions workflow](/.github/workflows/publish-backend.yml) that does the build & publish to Azure.

To deploy the frontend to Twitch, run the `package-frontend.sh` script, then upload `frontend.zip` to the Files tab of your extension developer console page.

## License

MIT License - [LICENSE.md](LICENSE.md)

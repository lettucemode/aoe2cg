# aoe2cg

Twitch panel extension to facilitate community games for Age of Empires II: Definitive Edition. 

![Backend](https://github.com/lettucemode/aoe2cg/workflows/Backend/badge.svg)

## Built With

- [Twitch Extensions Helper/Reference](https://dev.twitch.tv/docs/extensions/reference)
- [Azure Functions](https://azure.microsoft.com/en-us/services/functions/)
- [Azure Cosmos Db](https://azure.microsoft.com/en-us/services/cosmos-db/)
- [Semantic UI](https://semantic-ui.com/)
- [JQuery](https://jquery.com/)

## Development & Testing

Here's how to get started with this code on a Windows machine. Other OSs are probably similar.

### Prerequisites

- [.NET Core SDK 3.1.201](https://dotnet.microsoft.com/download/dotnet-core/3.1)
-  Azure Functions Core Tools v3:
```
npm install -g azure-functions-core-tools@3
```
- Visual Studio Code and these extensions:
  - Azure Functions
  - C#

### Backend

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

#### local.settings.json

After cloning, create `backend/local.settings.json` with these contents:

```
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet",
  },
  "Host": {
    "CORS": "*"
  }
}
```
plus whatever other environment settings you desire, then fetch them during runtime with `Environment.GetEnvironmentVariable()`.

### Frontend

- Create a panel extension in your [Extensions Developer Console](https://dev.twitch.tv/console/extensions).
- Install the Twitch Extensions Developer Rig from their [developer documentation](https://dev.twitch.tv/docs/extensions/rig).
- Run `frontend/package-frontend.sh` to fetch the dependencies (requires a [bash shell](https://git-scm.com/) and [7zip](https://www.7-zip.org/), or just download them manually).
- Connect the rig to your new extension and configure it to run the views in `/frontend`. Refer to the developer documentation for more details on the rig, how extensions work, and how to run the extension on your channel.

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

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

This extension uses Azure cloud resources to function, and I have not included any of the keys/URLs in this repo for obvious reasons. So you aren't going to be able to run it yourself without setting up your own cloud resources first.

With that said, here's how I run and test this code on a Windows machine. Other OSs are probably similar.

### Prerequisites

- [.NET Core SDK 3.1.201](https://dotnet.microsoft.com/download/dotnet-core/3.1)
- [Azure Functions Core Tools v3](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=windows%2Ccsharp%2Cbash):

```
npm install -g azure-functions-core-tools@3
```

- [Visual Studio Code](https://code.visualstudio.com/) with these extensions:
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
    "FUNCTIONS_WORKER_RUNTIME": "dotnet"
  },
  "Host": {
    "CORS": "*"
  }
}
```

plus whatever other environment settings you desire, then fetch them during runtime with `Environment.GetEnvironmentVariable()`.

### Frontend

- Run `package-frontend.sh` once to pull down the dependencies (or you can get them manually).
- Follow the instructions in the [Twitch Developer Documentation](https://dev.twitch.tv/docs/extensions) to create an extension and install the Developer Rig.
- Connect the rig to the new extension and configure it to run the views in `/frontend`. If it's set up correctly, the views will display in the rig and the twitch helper events will fire.

## Deployments

To deploy the backend to the Azure Functions App:

```
cd backend
func azure functionapp publish <app name here>
```

There's also a [GitHub Actions workflow](/.github/workflows/publish-backend.yml) that does the build & publish to Azure.

To deploy the frontend to Twitch, run the `package-frontend.sh` script, then upload `frontend.zip` to the Files tab of the extension developer console page.

## Thanks

Many thanks to the [TwitchDev Discord](https://discord.com/invite/G8UQqNy) for answering all my questions, especially BarryCarlyon#1698, Breci#1906, Dist#5867, WLG3R#4917, and Marenthyu#4211.

Thanks to [T90Official and his community](https://discord.gg/t90official) for being cool enough to inspire me to make this.

## License

MIT License - [LICENSE.md](LICENSE.md)

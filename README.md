# aoe2cg

Twitch extension to facilitate community games for Age of Empires II: Definitive Edition. 

![Publish Backend](https://github.com/lettucemode/aoe2cg/workflows/Publish%20Backend/badge.svg)

## Setting up the dev environment

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### local.settings.json

After cloning, create a file named `backend/local.settings.json` with these contents:

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

If you'll be using Cosmos Db for your long-term storage, then `CosmosConnectionString` is the connection string to your Cosmos Db account, the one that includes both `AccountEndpoint` and `AccountKey`. You can get that from the Azure portal. 

### Prerequisites

What things you need to install the software and how to install them

```
Give examples
```

### Installing

A step by step series of examples that tell you how to get a development env running

Say what the step will be

```
Give the example
```

And repeat

```
until finished
```

End with an example of getting some data out of the system or using it for a little demo

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

- [Semantic UI](https://semantic-ui.com/)
- [JQuery](https://jquery.com/)
- [Azure Functions](https://azure.microsoft.com/en-us/services/functions/)
- [Azure Cosmos Db](https://azure.microsoft.com/en-us/services/cosmos-db/)

## License

MIT License - [LICENSE.md](LICENSE.md)

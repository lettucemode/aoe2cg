# aoe2cg

Twitch panel extension to facilitate community games for Age of Empires II: Definitive Edition.

![Backend](https://github.com/lettucemode/aoe2cg/workflows/Backend/badge.svg)

## Built With

- [Twitch Extensions Helper/Reference](https://dev.twitch.tv/docs/extensions/reference)
- [Azure Functions](https://azure.microsoft.com/en-us/services/functions/)
- [Azure Cosmos Db](https://azure.microsoft.com/en-us/services/cosmos-db/)
- [Bootstrap](https://getbootstrap.com/)
- [JQuery](https://jquery.com/)

## Development & Testing

Here's how I run and test this code on a Windows machine. Other OSs are probably similar.

### Backend

Read the [official documentation](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-function-vs-code?pivots=programming-language-csharp) to get started with Azure Functions written in C#.

After you're set up, build the backend with:

```
cd backend
dotnet build
```

### Frontend

Read the [Twitch Developer Documentation](https://dev.twitch.tv/docs/extensions) to create an extension and install the Developer Rig.

Run `package-frontend.sh` once to pull down the dependencies (or you can get them manually).

Connect the rig to the new extension and configure it to run the views in `/frontend`. If it's set up correctly, the views will display in the rig and the twitch helper events will fire.

## Deployments

This repo uses a [GitHub Actions workflow](/.github/workflows/push-backend.yml) to do the build & publish to Azure.

To deploy the frontend to Twitch, run `package-frontend.sh` then upload `frontend.zip` to the Files tab of the extension developer console page.

## Thanks

Many thanks to the [TwitchDev Discord](https://discord.com/invite/G8UQqNy) for answering all my questions, especially BarryCarlyon#1698, Breci#1906, Dist#5867, WLG3R#4917, and Marenthyu#4211.

Thanks to [T90Official and his community](https://discord.gg/t90official) for being cool enough to inspire me to make this.

## License

MIT License - [LICENSE.md](LICENSE.md)

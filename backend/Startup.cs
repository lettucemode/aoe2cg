using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Functions.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection;
using System;

[assembly: FunctionsStartup(typeof(aoe2cg.Startup))]

namespace aoe2cg
{
    class Startup : FunctionsStartup
    {
        public override void Configure(IFunctionsHostBuilder builder)
        {
            builder.Services.AddSingleton<TwitchService>(
                s => new TwitchService(
                    Environment.GetEnvironmentVariable("ExtensionClientId"),
                    Environment.GetEnvironmentVariable("ExtensionSecret"),
                    Environment.GetEnvironmentVariable("ExtensionOwnerId"),
                    Environment.GetEnvironmentVariable("ClientSecret")
                ));

            builder.Services.AddSingleton<CosmosClient>(
                c => new CosmosClient(Environment.GetEnvironmentVariable("CosmosConnectionString")));
        }
    }
}
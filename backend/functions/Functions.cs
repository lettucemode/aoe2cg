using Microsoft.Azure.Cosmos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace aoe2cg
{
    public partial class Functions
    {
        private readonly TwitchService _twitchService;
        private readonly CosmosClient _cosmosClient;
        private readonly string _cosmosDbName;

        public Functions(TwitchService twitchService, CosmosClient cosmosClient)
        {
            this._twitchService = twitchService;
            this._cosmosClient = cosmosClient;
            this._cosmosDbName = Environment.GetEnvironmentVariable("CosmosDbName");
        }

        private async Task<Game> GetActiveGame(string channelId)
        {
            var query = new QueryDefinition(
                "select * from games g where g.channelId = @channelId and g.gameState = @gameState ")
                .WithParameter("@channelId", channelId)
                .WithParameter("@gameState", "Active");
            var resultSet = this.Games().GetItemQueryIterator<Game>(
                query,
                requestOptions: new QueryRequestOptions
                {
                    MaxItemCount = 1,
                });

            Game activeGame = null;
            while (resultSet.HasMoreResults)
            {
                var response = await resultSet.ReadNextAsync();
                activeGame = response.FirstOrDefault();
            }
            return activeGame;
        }

        private async Task<Registration> GetRegistration(string gameId, string userId)
        {
            var query = new QueryDefinition(
                "select * from registrations r where r.gameId = @gameId and r.opaqueUserId = @opaqueUserId ")
                .WithParameter("@gameId", gameId)
                .WithParameter("@opaqueUserId", userId);
            var resultSet = this.Registrations().GetItemQueryIterator<Registration>(
                query,
                requestOptions: new QueryRequestOptions
                {
                    MaxItemCount = 1,
                });

            Registration userReg = null;
            while (resultSet.HasMoreResults)
            {
                var response = await resultSet.ReadNextAsync();
                userReg = response.FirstOrDefault();
            }
            return userReg;
        }

        private async Task<List<Registration>> GetRegistrations(string gameId)
        {
            var query = new QueryDefinition(
                "select * from registrations r where r.gameId = @gameId ")
                .WithParameter("@gameId", gameId);
            var resultSet = this.Registrations().GetItemQueryIterator<Registration>(
                query,
                requestOptions: new QueryRequestOptions
                {
                    MaxItemCount = 100,
                });

            List<Registration> winners = new List<Registration>();
            while (resultSet.HasMoreResults)
            {
                var response = await resultSet.ReadNextAsync();
                winners.AddRange(response);
            }
            return winners;
        }

        private async Task<List<Registration>> GetWinners(string gameId)
        {
            var query = new QueryDefinition(
                "select * from registrations r where r.gameId = @gameId and r.winner ")
                .WithParameter("@gameId", gameId);
            var resultSet = this.Registrations().GetItemQueryIterator<Registration>(
                query,
                requestOptions: new QueryRequestOptions
                {
                    MaxItemCount = 100,
                });

            List<Registration> winners = new List<Registration>();
            while (resultSet.HasMoreResults)
            {
                var response = await resultSet.ReadNextAsync();
                winners.AddRange(response);
            }
            return winners;
        }

        private async Task<List<Registration>> GetNonWinners(string gameId)
        {
            var query = new QueryDefinition(
                "select * from registrations r where r.gameId = @gameId and not r.winner ")
                .WithParameter("@gameId", gameId);
            var resultSet = this.Registrations().GetItemQueryIterator<Registration>(
                query,
                requestOptions: new QueryRequestOptions
                {
                    MaxItemCount = 100,
                });

            List<Registration> winners = new List<Registration>();
            while (resultSet.HasMoreResults)
            {
                var response = await resultSet.ReadNextAsync();
                winners.AddRange(response);
            }
            return winners;
        }

        private async Task SaveGame(Game game)
        {
            if (string.IsNullOrWhiteSpace(game.id)) game.id = Guid.NewGuid().ToString();
            await this.Games().UpsertItemAsync(game);
        }

        private async Task SaveRegistration(Registration reg)
        {
            if (string.IsNullOrWhiteSpace(reg.id)) reg.id = Guid.NewGuid().ToString();
            await this.Registrations().UpsertItemAsync(reg);
        }

        private Container Games()
        {
            return this._cosmosClient.GetContainer(this._cosmosDbName, "games");
        }

        private Container Registrations()
        {
            return this._cosmosClient.GetContainer(this._cosmosDbName, "registrations");
        }
    }
}

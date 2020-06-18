using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using JWT.Serializers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;

namespace aoe2cg
{
    public partial class Functions
    {
        [FunctionName("UpdateGameSettings")]
        public async Task<IActionResult> UpdateGameSettings(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = null)] HttpRequest req,
            ILogger log)
        {
            var validationResult = this._twitchService.ValidateToken(req, log);
            if (validationResult.Status != AccessTokenStatus.Valid) return new UnauthorizedResult();
            var jwt = validationResult.TwitchJwt;
            log.LogInformation($"updating game settings for channel {jwt.ChannelId}");

            // correct role?
            if (jwt.Role != "broadcaster")
            {
                var logMessage = $"Only broadcasters can invoke this for their channel.";
                log.LogInformation(logMessage);
                return new OkObjectResult(new
                {
                    success = false,
                    message = logMessage,
                });
            }

            // active game?
            var activeGame = await this.GetActiveGame(jwt.ChannelId);
            var newGame = false;
            if (activeGame == null)
            {
                activeGame = new Game
                {
                    gameState = GameState.Active,
                    channelId = jwt.ChannelId,
                };
                newGame = true;
            }

            var requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            var dataDict = new JsonNetSerializer().Deserialize<Dictionary<string, string>>(requestBody);
            var lobbyId = dataDict["lobbyId"];
            var lobbyPassword = dataDict["lobbyPassword"];
            var subMult = int.Parse(dataDict["subMult"]);
            var extVersion = dataDict["extVersion"];

            // update game information
            activeGame.lobbyId = lobbyId;
            activeGame.lobbyPassword = lobbyPassword;
            activeGame.subscriberMultiplier = subMult;
            await this.SaveGame(activeGame);

            var responseMessage = string.Empty;
            if (newGame)
            {
                await this._twitchService.SendPubSubBroadcast(jwt.ChannelId, GameState.Active, log);
                await this._twitchService.SendChannelChatMessage(jwt.ChannelId,
                    "A community game is starting! Enter the raffle using the panel below the stream!",
                    extVersion,
                    log);
                responseMessage = $"START THE GAME ALREADY {activeGame.id} CHANNEL {activeGame.channelId}.";
            }
            else
            {
                // if some viewers already won, notify them so they can fetch the new game info
                var winners = await this.GetWinners(activeGame.id);
                if (winners.Any())
                {
                    await this._twitchService.SendPubSubWhisper(jwt.ChannelId,
                        winners.Select(w => w.opaqueUserId), "Winner", log);
                }
                responseMessage = $"Game settings updated successfully for game {activeGame.id}, " +
                    $"channelId {activeGame.channelId}.";
            }

            log.LogInformation(responseMessage);
            return new OkObjectResult(new
            {
                success = true,
                message = responseMessage,
            });
        }
    }
}
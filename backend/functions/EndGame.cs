using System.Collections.Generic;
using System.IO;
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
        [FunctionName("EndGame")]
        public async Task<IActionResult> EndGame(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = null)] HttpRequest req,
            ILogger log)
        {
            var validationResult = this._twitchService.ValidateToken(req, log);
            if (validationResult.Status != AccessTokenStatus.Valid) return new UnauthorizedResult();
            var jwt = validationResult.TwitchJwt;
            log.LogInformation("ending game");

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
            if (activeGame == null)
            {
                var logMessage = $"No active game for channel id {jwt.ChannelId}. ";
                log.LogInformation(logMessage);
                return new OkObjectResult(new
                {
                    success = false,
                    message = logMessage,
                });
            }

            var requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            var dataDict = new JsonNetSerializer().Deserialize<Dictionary<string, string>>(requestBody);
            var extVersion = dataDict["extVersion"];

            // end game & notify viewers to update frontend
            activeGame.gameState = GameState.Ended;
            await this.SaveGame(activeGame);
            await this._twitchService.SendPubSubBroadcast(jwt.ChannelId, GameState.Ended.ToString(), log);
            await this._twitchService.SendChannelChatMessage(jwt.ChannelId,
                "The raffle is over and the game is starting soon. Enjoy! 14 14 14",
                extVersion,
                log);

            var responseMessage = $"Game id {activeGame.id} ended.";
            log.LogInformation(responseMessage);
            return new OkObjectResult(new
            {
                success = true,
                message = responseMessage,
            });
        }
    }
}
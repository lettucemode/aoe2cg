using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;

namespace aoe2cg
{
    public partial class Functions
    {
        [FunctionName("ForbiddenKnowledge")]
        public async Task<IActionResult> ForbiddenKnowledge(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = null)] HttpRequest req,
            ILogger log)
        {
            var validationResult = this._twitchService.ValidateToken(req, log);
            if (validationResult.Status != AccessTokenStatus.Valid) return new UnauthorizedResult();
            var jwt = validationResult.TwitchJwt;
            log.LogInformation("F O R B I D D E N K N O W L E D G E");

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

            // did user win?
            var userReg = await this.GetRegistration(activeGame.id, jwt.OpaqueUserId);
            if (userReg == null || !userReg.winner)
            {
                var logMessage = $"User {jwt.OpaqueUserId} didn't reg/win game {activeGame.id}.";
                log.LogInformation(logMessage);
                return new OkObjectResult(new
                {
                    success = false,
                    message = logMessage,
                });
            }

            // save that they acknowledged they weren't afk and notify broadcaster
            userReg.confirmed = true;
            await this.SaveRegistration(userReg);
            await _twitchService.SendPubSubBroadcast(jwt.ChannelId, $"confirmed {userReg.opaqueUserId}", log);

            // give them what they desire
            var responseMessage = $"Sending knowledge to user {jwt.OpaqueUserId}.";
            log.LogInformation(responseMessage);
            return new OkObjectResult(new
            {
                success = true,
                lobbyId = activeGame.lobbyId,
                lobbyPassword = activeGame.lobbyPassword,
                message = responseMessage,
            });
        }
    }
}
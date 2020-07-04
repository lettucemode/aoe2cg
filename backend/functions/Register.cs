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
        [FunctionName("Register")]
        public async Task<IActionResult> Register(
            [HttpTrigger(AuthorizationLevel.Function, "post", Route = null)] HttpRequest req,
            ILogger log)
        {
            var validationResult = this._twitchService.ValidateToken(req, log);
            if (validationResult.Status != AccessTokenStatus.Valid) return new UnauthorizedResult();
            var jwt = validationResult.TwitchJwt;
            log.LogInformation($"User registration for {jwt.OpaqueUserId}");

            // persistent user?
            if (jwt.OpaqueUserId.StartsWith('A'))
            {
                var logMessage = $"Opaque user ID {jwt.OpaqueUserId} is not persistent.";
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

            // already registered?
            var activeReg = await this.GetRegistration(activeGame.id, jwt.OpaqueUserId);
            if (activeReg != null)
            {
                var logMessage = $"User {jwt.OpaqueUserId} is already registered.";
                log.LogInformation(logMessage);
                return new OkObjectResult(new
                {
                    success = true,
                    message = logMessage,
                });
            }

            // create & save new registration            
            var requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            var dataDict = new JsonNetSerializer().Deserialize<Dictionary<string, string>>(requestBody);
            var isSubscriber = bool.Parse(dataDict["isSubscriber"]);
            var realUserId = dataDict["realUserId"];
            var newReg = new Registration
            {
                gameId = activeGame.id,
                opaqueUserId = jwt.OpaqueUserId,
                realUserId = realUserId,
                isSubscriber = isSubscriber,
                winner = false,
            };
            if (!string.IsNullOrWhiteSpace(realUserId))
            {
                var twitchUser = await this._twitchService.GetUserHelix(realUserId, log);
                newReg.displayName = twitchUser?.display_name;
            }
            await this.SaveRegistration(newReg);

            // notify broadcaster for entry counter
            await this._twitchService.SendPubSubBroadcast(jwt.ChannelId, "someoneRegistered", log);

            // send response
            var responseMessage = $"Successfully reg'd user {jwt.OpaqueUserId} " +
                $"for game {activeGame.id}, channelId {activeGame.channelId}.";
            log.LogInformation(responseMessage);
            return new OkObjectResult(new
            {
                success = true,
                message = responseMessage,
            });
        }
    }
}
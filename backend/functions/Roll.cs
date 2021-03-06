using System;
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
        [FunctionName("Roll")]
        public async Task<IActionResult> Roll(
            [HttpTrigger(AuthorizationLevel.Function, "post", Route = null)] HttpRequest req,
            ILogger log)
        {
            var validationResult = this._twitchService.ValidateToken(req, log);
            if (validationResult.Status != AccessTokenStatus.Valid) return new UnauthorizedResult();
            var jwt = validationResult.TwitchJwt;
            log.LogInformation("rollin'");

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

            // get request data
            var requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            var dataDict = new JsonNetSerializer().Deserialize<Dictionary<string, string>>(requestBody);
            var numToRoll = int.Parse(dataDict["numToRoll"]);
            var extVersion = dataDict["extVersion"];

            // setup
            var candidates = new List<Registration>();
            var weights = new List<int>();
            var winners = new List<Registration>();
            var rng = new Random();

            // standard weighted rng algorithm
            // subscribers get their chances increased by the game's sub multiplier
            foreach (var reg in await this.GetNonWinners(activeGame.id))
            {
                candidates.Add(reg);
                weights.Add(reg.isSubscriber ? Math.Max(1, activeGame.subscriberMultiplier) : 1);
            }
            while (winners.Count < numToRoll)
            {
                int totalWeight = weights.Sum();
                var roll = rng.Next(0, totalWeight);
                for (var i = 0; i < candidates.Count; ++i)
                {
                    if (roll < weights[i])
                    {
                        winners.Add(candidates[i]);
                        candidates.RemoveAt(i);
                        weights.RemoveAt(i);
                        break;
                    }
                    roll -= weights[i];
                }

                // early exit in case broadcaster rolls more than the number of entrants
                if (!candidates.Any()) break;
            }

            if (winners.Any())
            {
                // save db records
                winners.ForEach(async w =>
                {
                    w.winner = true;
                    await this.SaveRegistration(w);
                });

                // send chat message with winner names
                var chatMessage = $"{winners.Count()} winner(s) rolled: " +
                    string.Join(", ", winners.Select(
                        w => string.IsNullOrWhiteSpace(w.displayName) ? "unknown" : w.displayName)) +
                    "! ";
                if (chatMessage.Length < 230)
                {
                    chatMessage += "Check the panel below the stream for the game info!";
                }
                await this._twitchService.SendChannelChatMessage(jwt.ChannelId, chatMessage, extVersion, log);

                // notify winner frontends
                await this._twitchService.SendPubSubWhisper(
                    jwt.ChannelId, winners.Select(w => w.opaqueUserId), "Winner", log);
            }

            // send response
            var responseMessage = "Winners rolled: " + string.Join(",", winners.Select(w => w.opaqueUserId));
            responseMessage = responseMessage.TrimEnd(',');
            log.LogInformation(responseMessage);

            // backwards-compat
            if (extVersion == "1.0.0") 
            {
                return new OkObjectResult(new
                {
                    success = true,
                    message = responseMessage,
                    winners = new JsonNetSerializer().Serialize(winners.Select(w => new { w.displayName, w.opaqueUserId, confirmed = false })),
                });
            }

            return new OkObjectResult(new
            {
                success = true,
                message = responseMessage,
                winners = winners.Select(w => new { w.displayName, w.opaqueUserId, confirmed = false }),
            });
        }
    }
}
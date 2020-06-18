using System.Linq;
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
        [FunctionName("CheckStatus")]
        public async Task<ActionResult> CheckStatus(
            [HttpTrigger(AuthorizationLevel.Function, "get", Route = null)] HttpRequest req,
            ILogger log)
        {
            var validationResult = this._twitchService.ValidateToken(req, log);
            if (validationResult.Status != AccessTokenStatus.Valid) return new UnauthorizedResult();
            var jwt = validationResult.TwitchJwt;
            log.LogInformation("Checking status.");

            // send info about the active game (if any) so the frontend
            // can "remember" where it was if someone refreshes the page
            var result = new StatusResult();
            var activeGame = await this.GetActiveGame(jwt.ChannelId);
            if (activeGame != null)
            {
                var gameRegs = await this.GetRegistrations(activeGame.id);
                var userReg = gameRegs.FirstOrDefault(r => r.opaqueUserId == jwt.OpaqueUserId);
                result.gameStatus = activeGame.gameState;
                result.registered = userReg != null;
                result.winner = userReg != null ? userReg.winner : false;
                result.subMult = activeGame.subscriberMultiplier;

                if (jwt.Role == "broadcaster")
                {
                    result.lobbyId = activeGame.lobbyId;
                    result.lobbyPassword = activeGame.lobbyPassword;
                    result.entryCount = gameRegs.Count;
                }
            }

            return new OkObjectResult(result);
        }

        private class StatusResult
        {
            public string gameStatus { get; set; }
            public bool registered { get; set; }
            public bool winner { get; set; }
            public string lobbyId { get; set; }
            public string lobbyPassword { get; set; }
            public int subMult { get; set; }
            public int entryCount { get; set; }
            public StatusResult()
            {
                gameStatus = GameState.Ended.ToString();
                registered = false;
                winner = false;
                lobbyId = string.Empty;
                lobbyPassword = string.Empty;
                subMult = 1;
            }
        }
    }
}
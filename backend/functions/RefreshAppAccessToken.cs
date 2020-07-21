using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using Microsoft.Extensions.Logging;

namespace aoe2cg
{
    public partial class Functions
    {
        [FunctionName("RefreshAppAccessToken")]
        public async Task RefreshAppAccessToken(
            [TimerTrigger("0 0 6 * * *", RunOnStartup = false)] TimerInfo timer,
            ILogger log)
        {
            log.LogInformation("Refreshing app access token...");

            var appAccessToken = await this._twitchService.GetAppAccessToken(log);
            var storedToken = await this.GetStoredToken();
            if (storedToken == null) storedToken = new Token();
            storedToken.appAccessToken = appAccessToken.access_token;
            await this.SaveToken(storedToken);

            log.LogInformation("App access token refreshed.");
        }
    }
}
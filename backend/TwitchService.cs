using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using JWT;
using JWT.Algorithms;
using JWT.Serializers;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

namespace aoe2cg
{
    public class TwitchService
    {
        private const string AUTH_HEADER_NAME = "Authorization";
        private const string BEARER_PREFIX = "Bearer ";
        private readonly string _extClientId;
        private readonly string _extSecret;
        private readonly string _extOwnerId;
        private readonly string _clientSecret;

        public TwitchService(string extensionClientId,
            string extensionSecret, string extensionOwnerId, string clientSecret)
        {
            this._extClientId = extensionClientId;
            this._extSecret = extensionSecret;
            this._extOwnerId = extensionOwnerId;
            this._clientSecret = clientSecret;
        }

        public AccessTokenResult ValidateToken(HttpRequest request, ILogger log)
        {
            try
            {
                if (request != null &&
                    request.Headers.ContainsKey(AUTH_HEADER_NAME) &&
                    request.Headers[AUTH_HEADER_NAME].ToString().StartsWith(BEARER_PREFIX))
                {
                    var token = request.Headers[AUTH_HEADER_NAME].ToString().Substring(BEARER_PREFIX.Length);

                    var tokenParams = new TokenValidationParameters()
                    {
                        RequireSignedTokens = true,
                        ValidateAudience = false,
                        ValidateIssuer = false,
                        ValidateIssuerSigningKey = true,
                        ValidateLifetime = true,
                        IssuerSigningKey = new SymmetricSecurityKey(Convert.FromBase64String(this._extSecret)),
                    };
                    var handler = new JwtSecurityTokenHandler();
                    var validateResult = handler.ValidateToken(token, tokenParams, out var securityToken);
                    var claims = validateResult.Claims.ToList();

                    var tokenResult = new AccessTokenResult
                    {
                        Status = AccessTokenStatus.Valid,
                        Token = token,
                        TwitchJwt = new TwitchJwt
                        {
                            ChannelId = claims.Find(c => c.Type == "channel_id").Value,
                            Expiration = int.Parse(claims.Find(c => c.Type == "exp").Value),
                            OpaqueUserId = claims.Find(c => c.Type == "opaque_user_id").Value,
                            PubSubPerms = new JsonNetSerializer().Deserialize<PubSubPerms>(
                                claims.Find(c => c.Type == "pubsub_perms").Value),
                            Role = claims.Find(c => c.Type.EndsWith("role")).Value,
                        },
                    };
                    var realUserId = claims.FirstOrDefault(c => c.Type == "user_id");
                    if (realUserId != null) tokenResult.TwitchJwt.RealUserId = realUserId.Value;
                    return tokenResult;
                }

                log.LogWarning("No token in request.");
                return new AccessTokenResult
                {
                    Status = AccessTokenStatus.NoToken,
                    TwitchJwt = null,
                };
            }
            catch (SecurityTokenExpiredException)
            {
                log.LogWarning("Token is expired.");
                return new AccessTokenResult
                {
                    Status = AccessTokenStatus.Expired,
                    TwitchJwt = null,
                };
            }
            catch (Exception ex)
            {
                log.LogWarning($"Exception during token validation: {ex.Message} {ex.StackTrace}");
                return new AccessTokenResult
                {
                    Status = AccessTokenStatus.Error,
                    TwitchJwt = null,
                };
            }
        }

        public async Task SendPubSubBroadcast(string channelId, string message, ILogger log)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post,
                $"https://api.twitch.tv/extensions/message/{channelId}");
            request.Headers.Add("Client-ID", this._extClientId);
            request.Headers.Add("Authorization", BEARER_PREFIX + this.MakePubSubToken(channelId, false, log));

            var body = new Dictionary<string, object>
            {
                { "content_type", "application/json" },
                { "message", message },
                { "targets", new string[] { "broadcast" } },
            };
            request.Content = new StringContent(
                new JsonNetSerializer().Serialize(body), Encoding.UTF8, "application/json");

            using var client = new HttpClient();
            using var response = await client.SendAsync(request);
            log.LogInformation($"Send pubsub message {message} result: {response.StatusCode}.");
            if (!response.IsSuccessStatusCode)
            {
                log.LogInformation(await response.Content.ReadAsStringAsync());
            }
        }

        public async Task SendPubSubWhisper(string channelId, IEnumerable<string> userIds, string message, ILogger log)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post,
                $"https://api.twitch.tv/extensions/message/{channelId}");
            request.Headers.Add("Client-ID", this._extClientId);
            request.Headers.Add("Authorization", BEARER_PREFIX + this.MakePubSubToken(channelId, true, log));

            var body = new Dictionary<string, object>
            {
                { "content_type", "application/json" },
                { "message", message },
                { "targets", userIds.Select(uid => $"whisper-{uid}").ToArray() },
            };
            request.Content = new StringContent(
                new JsonNetSerializer().Serialize(body), Encoding.UTF8, "application/json");

            using var client = new HttpClient();
            using var response = await client.SendAsync(request);
            log.LogInformation($"Send pubsub message {message} result: {response.StatusCode}.");
            if (!response.IsSuccessStatusCode)
            {
                log.LogInformation(await response.Content.ReadAsStringAsync());
            }
        }

        public async Task<TwitchUser> GetUserHelix(string realUserId, string appAccessToken, ILogger log)
        {
            using var request = new HttpRequestMessage(
                HttpMethod.Get, $"https://api.twitch.tv/helix/users?id={realUserId}");
            request.Headers.Add("Client-ID", this._extClientId);
            request.Headers.Add("Authorization", BEARER_PREFIX + appAccessToken);

            using var client = new HttpClient();
            using var response = await client.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();
            log.LogInformation($"Get user {realUserId} result: {response.StatusCode}.");
            if (!response.IsSuccessStatusCode)
            {
                log.LogInformation(responseBody);
                return null;
            }

            var userResponse = new JsonNetSerializer().Deserialize<GetUserResponse>(responseBody);
            return userResponse.data.Any() ? userResponse.data[0] : null;
        }

        public async Task SendChannelChatMessage(string channelId, string message, string extVersion, ILogger log)
        {
            var url = $"https://api.twitch.tv/extensions/{this._extClientId}/" +
                $"{extVersion}/channels/{channelId}/chat";
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Add("Client-ID", this._extClientId);
            request.Headers.Add("Authorization", BEARER_PREFIX + this.MakePubSubToken(channelId, false, log));

            var body = new Dictionary<string, string>
            {
                { "text", message }
            };
            request.Content = new StringContent(
                new JsonNetSerializer().Serialize(body), Encoding.UTF8, "application/json");

            using var client = new HttpClient();
            using var response = await client.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();
            log.LogInformation($"Send chat message result: {response.StatusCode}.");
        }

        public async Task<AppAccessToken> GetAppAccessToken(ILogger log)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post,
                $"https://id.twitch.tv/oauth2/token?" +
                $"client_id={this._extClientId}" +
                $"&client_secret={this._clientSecret}" +
                $"&grant_type=client_credentials" +
                $"&scope=user_read");
            using var client = new HttpClient();
            using var response = await client.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();
            log.LogInformation($"Get app access token result: {response.StatusCode}.");
            if (!response.IsSuccessStatusCode)
            {
                log.LogInformation(responseBody);
                return new AppAccessToken();
            }

            var appAccessToken = new JsonNetSerializer().Deserialize<AppAccessToken>(responseBody);
            return appAccessToken;
        }

        private string MakePubSubToken(string channelId, bool isWhisper, ILogger log)
        {
            var perms = new perms { send = new string[] { isWhisper ? "whisper-*" : "*" } };
            var payload = new Dictionary<string, object>
            {
                { "exp", (DateTimeOffset.Now.ToUnixTimeSeconds() + 60) },
                { "user_id", this._extOwnerId },
                { "role", "external" },
                { "channel_id", channelId },
                { "pubsub_perms", perms }
            };
            log.LogInformation(new JsonNetSerializer().Serialize(payload));

            IJwtAlgorithm algorithm = new HMACSHA256Algorithm();
            IJsonSerializer serializer = new JsonNetSerializer();
            IBase64UrlEncoder urlEncoder = new JwtBase64UrlEncoder();
            IJwtEncoder encoder = new JwtEncoder(algorithm, serializer, urlEncoder);
            var token = encoder.Encode(payload, Convert.FromBase64String(this._extSecret));
            return token;
        }
    }

    #region Supporting classes

    public class PubSubPerms
    {
        public string[] listen { get; set; }

        public string[] send { get; set; }
    }

    public class TwitchJwt
    {
        public string ChannelId { get; set; }

        public int Expiration { get; set; }

        public bool IsUnlinked { get; set; }

        public string OpaqueUserId { get; set; }

        public PubSubPerms PubSubPerms { get; set; }

        public string Role { get; set; }

        public string RealUserId { get; set; }
    }

    public enum AccessTokenStatus
    {
        Valid,
        Expired,
        Error,
        NoToken
    }

    public class AccessTokenResult
    {
        public AccessTokenStatus Status { get; set; }

        public TwitchJwt TwitchJwt { get; set; }

        public string Token { get; set; }
    }

    public class perms
    {
        public string[] send;
    }

    public class AppAccessToken
    {
        public string access_token { get; set; }
        public string refresh_token { get; set; }
        public int expires_in { get; set; }
        public string[] scope { get; set; }
        public string token_type { get; set; }
    }

    public class GetUserResponse
    {
        public TwitchUser[] data { get; set; }
    }

    public class TwitchUser
    {
        public string broadcaster_type { get; set; }
        public string description { get; set; }
        public string display_name { get; set; }
        public string email { get; set; }
        public string id { get; set; }
        public string login { get; set; }
        public string offline_image_url { get; set; }
        public string public_image_url { get; set; }
        public string type { get; set; }
        public int view_count { get; set; }
    }

    #endregion
}
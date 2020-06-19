namespace aoe2cg
{
    public class Registration
    {
        public string id { get; set; }
        public string opaqueUserId { get; set; }
        public string realUserId { get; set; }
        public string displayName { get; set; }
        public bool isSubscriber { get; set; }
        public string gameId { get; set; }
        public bool winner { get; set; }
    }









    public class Game
    {
        public string id { get; set; }
        public string gameState { get; set; }
        public string lobbyId { get; set; }
        public string lobbyPassword { get; set; }
        public string channelId { get; set; }
        public int subscriberMultiplier { get; set; }
    }

    public class GameState
    {
        public static string Active = "Active";
        public static string Ended = "Ended";
    }
}
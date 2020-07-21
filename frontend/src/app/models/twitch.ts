// constructed (not all of it)
// from https://dev.twitch.tv/docs/extensions/reference#javascript-helper

export type PubSubCallback = (target: string, contentType: string, message: string) => void;

export class TwitchAuth {
  channelId: string;
  clientId: string;
  token: string;
  userId: string;
}

export class TwitchConfig {
  functionsAuthKey: string;
  functionsBaseUrl: string;
}

export class TwitchContext {
  arePlayerControlsVisible: boolean;
  bitrate: number;
  bufferSize: number;
  displayResolution: string;
  game: string;
  hlsLatencyBroadcaster: number;
  hostingInfo: object;
  isFullScreen: boolean;
  isMuted: boolean;
  isPaused: boolean;
  isTheatreMode: boolean;
  language: string;
  mode: string;
  playbackMode: string;
  theme: string;
  videoResolution: string;
  volume: number;
}

export interface Twitch {
  ext: TwitchHelper;
}

export interface TwitchHelper {
  version: string;
  environment: string;
  actions: Actions;
  configuration: Configuration;
  viewer: Viewer;

  onAuthorized(f: (auth: TwitchAuth) => void): void;
  onContext(f: (context: TwitchContext) => void): void;
  listen(target: string, f: PubSubCallback): void;
}

interface Actions {
  requestIdShare(): void;
}

interface ConfigChunk {
  version: string;
  content: string;
}

interface Configuration {
  broadcaster: ConfigChunk | undefined;
  developer: ConfigChunk | undefined;
  global: ConfigChunk | undefined;
  onChanged(f: () => void): void;
}

interface SubscriptionStatus {
  tier: string;
}

interface Viewer {
  opaqueId: string;
  id: string | null;
  role: string;
  isLinked: boolean;
  sessionToken: string;
  subscriptionStatus: SubscriptionStatus | null;
}

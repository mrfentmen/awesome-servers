/**
 * Twitch Helix API client. Needs TWITCH_CLIENT_ID + TWITCH_CLIENT_SECRET
 * (free at https://dev.twitch.tv/console). Uses client-credentials grant.
 * Docs: https://dev.twitch.tv/docs/api/
 */
export declare class TwitchError extends Error {
}
export interface Game {
    id: string;
    name: string;
}
export declare function topGames(limit?: number): Promise<Game[]>;
export interface Stream {
    user: string;
    game?: string;
    title?: string;
    viewers?: number;
    language?: string;
}
export declare function topStreams(gameId?: string, limit?: number): Promise<Stream[]>;
export interface TwitchUser {
    id: string;
    login: string;
    name?: string;
    broadcasterType?: string;
    description?: string;
}
export declare function getUser(login: string): Promise<TwitchUser | null>;
export declare function formatStream(s: Stream, index?: number): string;
export declare function formatUser(u: TwitchUser): string;
/**
 * Whether Twitch itself is up, component by component: login, web, chat, watching,
 * broadcasting and purchases each with their published state, plus anything open
 * right now. Worth checking before blaming a stream for not going out.
 */
export declare function serviceStatus(): Promise<string>;

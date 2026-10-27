export declare class BggError extends Error {
}
export interface GameSummary {
    id: string;
    name: string;
    yearPublished?: string;
    type?: string;
}
export interface GameDetails extends GameSummary {
    description?: string;
    minPlayers?: string;
    maxPlayers?: string;
    playingTime?: string;
    minPlayTime?: string;
    maxPlayTime?: string;
    minAge?: string;
    categories?: string[];
    mechanics?: string[];
    designers?: string[];
    artists?: string[];
    publishers?: string[];
    usersRated?: string;
    average?: string;
    bayesAverage?: string;
    rank?: string;
}
export declare function decodeEntities(s: string): string;
export declare function parseSearch(xml: string): GameSummary[];
export declare function parseThing(xml: string): GameDetails | null;
export declare function searchGames(query: string, exact?: boolean, limit?: number): Promise<GameSummary[]>;
export declare function getGame(id: string): Promise<GameDetails | null>;
export declare function hotGames(limit?: number): Promise<GameSummary[]>;
export declare function formatSummary(g: GameSummary, index?: number): string;
export declare function formatDetails(g: GameDetails): string;
export interface BggUser {
    username: string;
    firstName?: string;
    lastName?: string;
    yearRegistered?: string;
}
export declare function getUser(username: string): Promise<BggUser | null>;
export declare function userPlays(username: string, limit?: number): Promise<string[]>;
export declare function userCollection(username: string, own?: boolean, limit?: number): Promise<GameSummary[]>;
export declare function guildInfo(id: string): Promise<string>;
export declare function forumThreads(id: string, limit?: number): Promise<string[]>;
export declare function threadArticles(id: string, limit?: number): Promise<string[]>;
export declare function geeklist(id: string, limit?: number): Promise<GameSummary[]>;

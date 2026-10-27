export declare class OgsError extends Error {
}
export interface PlayerSummary {
    id: number;
    username: string;
    country?: string;
    rating?: number;
}
export declare function searchPlayers(username: string, limit?: number): Promise<PlayerSummary[]>;
export interface PlayerDetails extends PlayerSummary {
    ratings: string[];
}
export declare function getPlayer(id: string): Promise<PlayerDetails | null>;
export interface GameSummary {
    id?: number;
    white?: string;
    black?: string;
    outcome?: string;
}
export declare function recentGames(id: string, limit?: number): Promise<GameSummary[]>;
export declare function formatPlayer(p: PlayerSummary, index?: number): string;
export declare function formatDetails(p: PlayerDetails): string;
export declare function formatGame(g: GameSummary, index?: number): string;
/** Public OGS clubs and groups, with member counts. */
export declare function groupList(args: {
    limit?: number;
}): Promise<string>;

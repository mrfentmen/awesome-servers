export declare class FaceitError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchPlayers(nickname: string): Promise<string>;
export declare function getPlayer(playerId: string): Promise<string>;
export declare function getPlayerStats(playerId: string, game?: string): Promise<string>;
export declare function getPlayerHistory(playerId: string, game?: string, offset?: number, limit?: number): Promise<string>;
export declare function searchTeams(name: string): Promise<string>;
export declare function getChampionships(game?: string, limit?: number): Promise<string>;

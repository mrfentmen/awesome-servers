export declare class PubgError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getPlayer(playerName: string, shard?: string): Promise<string>;
export declare function getMatch(matchId: string, shard?: string): Promise<string>;
export declare function getSeasons(shard?: string): Promise<string>;
export declare function getLifetimeStats(accountId: string, shard?: string): Promise<string>;
export declare function getSeasonStats(accountId: string, seasonId: string, shard?: string): Promise<string>;

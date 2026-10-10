export declare class MobyError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchGames(query: string, limit?: string): Promise<string>;
export declare function getGame(gameId: string): Promise<string>;
/** One game's store profile, from Valve's own app details document. */
export declare function steamGameProfile(args: {
    appid: number;
    limit?: number;
}): Promise<string>;
/** What is on special in the store right now, and how deep each discount runs. */
export declare function steamSpecialsCensus(args: {
    limit?: number;
}): Promise<string>;

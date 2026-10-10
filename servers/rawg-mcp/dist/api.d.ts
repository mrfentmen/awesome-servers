export declare class RawgError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchGames(query: string, limit?: string): Promise<string>;
export declare function getGame(gameId: string): Promise<string>;
/**
 * The Steam store record for an app: what it is, who made it, when it shipped,
 * which platforms and feature tags it carries, its price and its content notes.
 * RAWG aggregates this from many places; this is the storefront's own answer.
 */
export declare function steamStoreInfo(args: {
    app_id: string | number;
}): Promise<string>;
/**
 * How big a Steam title actually is: the ownership bracket SteamSpy estimates,
 * the players online right now, the positive and negative review split and the
 * median playtime. This is the only place a game's real reach is published.
 */
export declare function steamReach(args: {
    app_id: string | number;
}): Promise<string>;

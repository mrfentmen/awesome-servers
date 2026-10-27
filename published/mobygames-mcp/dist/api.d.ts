export declare class MobyError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchGames(query: string, limit?: string): Promise<string>;
export declare function getGame(gameId: string): Promise<string>;

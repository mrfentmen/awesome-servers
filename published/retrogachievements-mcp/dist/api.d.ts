export declare class RaError extends Error {
}
export declare function gameExtended(gameId: string): Promise<string>;
export declare function userProgress(username: string): Promise<string>;
export declare function libraryBreakdown(args: {
    games: string;
}): Promise<string>;

export declare class GuruError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listTeams(): Promise<string>;
export declare function searchCards(query: string, maxResults?: string): Promise<string>;
export declare function getCollection(collectionId: string): Promise<string>;

export declare class SuperNotesError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getCard(cardId: string): Promise<string>;
export declare function selectCards(search?: string, limit?: string): Promise<string>;
export declare function simpleCreateCard(name?: string, markup?: string): Promise<string>;
export declare function checkAuth(): Promise<string>;

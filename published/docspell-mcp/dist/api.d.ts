export declare class DocspellError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getVersion(): Promise<string>;
export declare function searchItems(query: string): Promise<string>;
export declare function getItem(itemId: string): Promise<string>;

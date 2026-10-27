export declare class DeviantartError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function browseHot(): Promise<string>;
export declare function browseNewest(): Promise<string>;
export declare function searchTags(tag: string): Promise<string>;
export declare function getDeviation(deviationIds: string): Promise<string>;

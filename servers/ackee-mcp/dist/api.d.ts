export declare class AckeeError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listDomains(): Promise<string>;
export declare function getDomain(domainId: string): Promise<string>;
export declare function getTopBrowsers(domainId: string): Promise<string>;
export declare function appStoreSearch(args: {
    query: string;
    country?: string;
    limit?: number;
}): Promise<string>;
export declare function appStoreReviews(args: {
    appId: string;
    page?: number;
    limit?: number;
}): Promise<string>;

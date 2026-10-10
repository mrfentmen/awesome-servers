export declare class KongError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getStatus(): Promise<string>;
export declare function listServices(): Promise<string>;
export declare function listRoutes(): Promise<string>;
/** Ask the gateway's edge what cross-origin requests it will accept, with a real preflight. */
export declare function corsPreflight(args: {
    url: string;
    origin: string;
    method?: string;
    headers?: string[];
}): Promise<string>;
/** What the public edge of a gateway discloses: its version, its cache, its own headers and what is missing. */
export declare function edgeHeaders(args: {
    url: string;
    method?: string;
}): Promise<string>;

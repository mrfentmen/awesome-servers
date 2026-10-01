export declare class OdyseeError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchClaims(query: string, size?: number): Promise<string>;
export declare function searchChannel(channel: string, size?: number): Promise<string>;

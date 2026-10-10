export declare class OdyseeError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchClaims(query: string, size?: number): Promise<string>;
export declare function searchChannel(channel: string, size?: number): Promise<string>;
/** Resolve one Odysee URL - lbry:// or https - into its full claim record. */
export declare function videoDetails(args: {
    url?: string;
}): Promise<string>;
/** Resolve an Odysee channel handle into its public record. */
export declare function channelProfile(args: {
    channel?: string;
}): Promise<string>;

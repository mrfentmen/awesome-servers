export declare class OpnSenseError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getFirmwareStatus(): Promise<string>;
export declare function getInterfaces(): Promise<string>;
/** Who owns an address that just showed up in a log, from the registry rather than a guess. */
export declare function ipOwnership(args: {
    ip?: string;
}): Promise<string>;
/** Is anything on this edge on the actively exploited list, and by when must it be fixed. */
export declare function knownExploitedCheck(args: {
    products?: string;
    limit?: number;
}): Promise<string>;
/** What a given OPNsense branch currently offers, and whether the package you need exists. */
export declare function packageAvailability(args: {
    branch?: string;
    package?: string;
    limit?: number;
}): Promise<string>;

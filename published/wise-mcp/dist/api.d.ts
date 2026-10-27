export declare class WiseError extends Error {
}
export interface Profile {
    id: number;
    type?: string;
    name?: string;
}
export declare function listProfiles(): Promise<Profile[]>;
export interface Balance {
    currency?: string;
    amount?: number;
}
export declare function getBalances(profileId: string): Promise<Balance[]>;
export declare function exchangeRate(from: string, to: string): Promise<number>;
/**
 * Which parts of Wise are working right now, and which have a declared fault.
 * Every component is listed with its own state, because a transfer working while
 * the card does not is a specific and common problem that an overall indicator
 * would hide.
 */
export declare function serviceHealth(args: {
    limit?: number;
}): Promise<string>;

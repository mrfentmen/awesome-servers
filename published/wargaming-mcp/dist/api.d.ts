export declare class WargamingError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchWotAccounts(search: string, limit?: number): Promise<string>;
export declare function getWotAccount(accountId: string): Promise<string>;
export declare function getWotTanks(accountId: string): Promise<string>;
export declare function searchWotClans(search: string, limit?: number): Promise<string>;
export declare function searchWowsAccounts(search: string, limit?: number): Promise<string>;
export declare function getWowsAccount(accountId: string): Promise<string>;

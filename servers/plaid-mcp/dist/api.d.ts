export declare class PlaidError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listInstitutions(count?: string): Promise<string>;
export declare function listCategories(): Promise<string>;
export declare function sandboxToken(institutionId?: string): Promise<string>;
export declare function getInstitution(institutionId: string): Promise<string>;
export declare function sandboxBalance(accessToken: string): Promise<string>;
export declare function sandboxTransactions(accessToken: string, days?: string): Promise<string>;
export declare function sandboxHoldings(accessToken: string): Promise<string>;
export declare function sandboxLiabilities(accessToken: string): Promise<string>;
export declare function sandboxAuth(accessToken: string): Promise<string>;
export declare function sandboxIdentity(accessToken: string): Promise<string>;
/**
 * Find a US bank by name and report its call-report basics: where it is, when
 * it was founded, its total assets and deposits, and its regulator.
 */
export declare function findBank(args: {
    name: string;
    limit?: number;
}): Promise<string>;
/**
 * One institution's financial health over time from its quarterly call reports:
 * size, profitability and net interest margin, and how each has moved.
 */
export declare function bankHealth(args: {
    cert: string;
    quarters?: number;
}): Promise<string>;
/**
 * The largest active banks in a US state, by total assets, with their deposit
 * base and regulator, which is how a customer compares a local bank.
 */
export declare function banksByState(args: {
    state: string;
    limit?: number;
}): Promise<string>;

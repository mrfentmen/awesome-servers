export declare class MercuryError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listAccounts(): Promise<string>;
export declare function getAccount(accountId: string): Promise<string>;
export declare function listTransactions(accountId: string, limit?: string): Promise<string>;
/** Find the US banks whose name matches, straight out of the FDIC's own data. */
export declare function fdicInstitutionSearch(args: {
    name: string;
    limit?: number;
    state?: string;
}): Promise<string>;
/** Put several banks side by side from one quarter of call report data. */
export declare function fdicCallReportCompare(args: {
    certs: string;
    repdte?: string;
}): Promise<string>;

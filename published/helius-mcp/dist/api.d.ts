export declare class HeliusError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getBalances(address: string): Promise<string>;
export declare function getTransactions(address: string, limit?: number): Promise<string>;
export declare function getNfts(address: string, page?: number): Promise<string>;
export declare function getTokenMetadata(mints: string): Promise<string>;
export declare function parseTransactions(transactions: string): Promise<string>;

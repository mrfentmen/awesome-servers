export declare class HeliusError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getBalances(address: string): Promise<string>;
export declare function getTransactions(address: string, limit?: number): Promise<string>;
export declare function getNfts(address: string, page?: number): Promise<string>;
export declare function getTokenMetadata(mints: string): Promise<string>;
export declare function parseTransactions(transactions: string): Promise<string>;
/**
 * The native RPC view of a wallet: SOL balance, account owner, whether it is
 * executable, and the SPL tokens it holds. No Helius key needed.
 */
export declare function walletHoldings(args: {
    address: string;
    limit?: number;
}): Promise<string>;
/** Where an SPL token actually trades: live price, liquidity and volume by pair. */
export declare function tokenMarket(args: {
    token?: string;
    query?: string;
    limit?: number;
}): Promise<string>;

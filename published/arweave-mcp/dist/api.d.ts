export declare class ArweaveError extends Error {
}
export declare function networkInfo(): Promise<string>;
export declare function txStatus(id: string): Promise<string>;
export declare function walletBalance(address: string): Promise<string>;
export declare function storagePrice(bytes: number): Promise<string>;
/**
 * Finds transactions by a tag, which is how Arweave applications mark their
 * data (App-Name, Content-Type, App-Version). The gateway's GraphQL requires a
 * value with the tag name, so both are needed.
 */
export declare function searchByTag(args: {
    tag: string;
    value: string;
    limit?: number;
}): Promise<string>;
/** Everything one wallet has written, newest first, with the tags that say what each upload is. */
export declare function addressTransactions(args: {
    address: string;
    limit?: number;
}): Promise<string>;
/**
 * Everything one block carries, including the mining reward and the weave size,
 * which the /info summary does not expose. Height "current" reads the tip.
 */
export declare function blockDetail(args: {
    height?: string;
}): Promise<string>;

export declare class EsploraError extends Error {
}
export declare function tipHeight(): Promise<number>;
export declare function feeEstimates(): Promise<string>;
export declare function mempoolFees(): Promise<string>;
export declare function getBlock(heightOrHash: string): Promise<string>;
export declare function getTx(txid: string): Promise<string>;
export declare function getAddress(address: string): Promise<string>;
export declare function recentBlocks(heightOrTip: string, limit?: number): Promise<string>;
export declare function recentMempool(limit?: number): Promise<string>;

export declare class MempoolError extends Error {
}
export declare function recommendedFees(): Promise<string>;
export declare function mempoolStats(): Promise<string>;
export declare function recentBlocks(limit: number): Promise<string>;
export declare function blockInfo(ref: string): Promise<string>;
export declare function addressInfo(address: string): Promise<string>;
export declare function difficultyAdjustment(): Promise<string>;

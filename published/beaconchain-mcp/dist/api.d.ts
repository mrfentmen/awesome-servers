export declare class BeaconchainError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getChainState(chain?: string): Promise<string>;
export declare function getValidatorRewards(validators: string, epoch?: number, chain?: string): Promise<string>;
export declare function getLatestEpoch(): Promise<string>;

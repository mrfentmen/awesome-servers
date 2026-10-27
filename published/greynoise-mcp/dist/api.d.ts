export declare class GreyNoiseError extends Error {
}
export declare function checkIp(ip: string): Promise<string>;
export declare function queryTags(query: string, limit?: number): Promise<string[]>;
export declare function communityIp(ip: string): Promise<string>;
export declare function ping(): Promise<string>;
export declare function gnqlStats(query: string): Promise<string>;

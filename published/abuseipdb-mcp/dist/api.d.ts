export declare class AbuseIpDbError extends Error {
}
export declare function checkIp(ip: string, days?: number): Promise<string>;
export declare function blacklist(limit?: number): Promise<string[]>;
export declare function checkBlock(network: string, days?: number): Promise<string>;
export declare function recentReports(ip: string, limit?: number): Promise<string[]>;

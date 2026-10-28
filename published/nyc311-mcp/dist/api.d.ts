export declare class Nyc311Error extends Error {
}
export declare function searchRequests(complaintType?: string, borough?: string, agency?: string, start?: string, end?: string, limit?: number): Promise<unknown>;
export declare function countRequests(complaintType?: string, borough?: string, agency?: string, start?: string, end?: string, limit?: number): Promise<unknown>;
export declare function format(value: unknown): string;
export declare function requestDetail(a: {
    uniqueKey: string;
}): Promise<string>;
export declare function agencyBreakdown(a: {
    start?: string;
    end?: string;
    limit?: number;
}): Promise<string>;
export declare function dailyTrend(a: {
    complaintType?: string;
    borough?: string;
    days?: number;
}): Promise<string>;

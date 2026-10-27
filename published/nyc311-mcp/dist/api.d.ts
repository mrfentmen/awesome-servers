export declare class Nyc311Error extends Error {
}
export declare function searchRequests(complaintType?: string, borough?: string, agency?: string, start?: string, end?: string, limit?: number): Promise<unknown>;
export declare function countRequests(complaintType?: string, borough?: string, agency?: string, start?: string, end?: string, limit?: number): Promise<unknown>;
export declare function format(value: unknown): string;
export interface AgencyBreakdownArgs {
    start?: string;
    end?: string;
    limit?: number;
}
export interface BoroughBreakdownArgs {
    start?: string;
    end?: string;
}
export declare function boroughBreakdown(args: BoroughBreakdownArgs): Promise<string>;
export interface OpenByTypeArgs {
    limit?: number;
}

export declare class Nyc311Error extends Error {
}
export declare function searchRequests(complaintType?: string, borough?: string, agency?: string, start?: string, end?: string, limit?: number): Promise<unknown>;
export declare function countRequests(complaintType?: string, borough?: string, agency?: string, start?: string, end?: string, limit?: number): Promise<unknown>;
export declare function format(value: unknown): string;

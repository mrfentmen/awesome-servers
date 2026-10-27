export declare class NpsError extends Error {
}
export interface Park {
    code: string;
    name?: string;
    states?: string;
    designation?: string;
    url?: string;
}
export declare function searchParks(query: string, limit?: number): Promise<Park[]>;
export declare function parkAlerts(code: string): Promise<string[]>;
export declare function parkCampgrounds(code: string, limit?: number): Promise<string[]>;
export declare function formatPark(p: Park, index?: number): string;

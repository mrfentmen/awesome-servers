export declare class EonetError extends Error {
}
export declare function listEvents(args: {
    days: number;
    category?: string;
    status?: "open" | "closed" | "all";
    limit: number;
}): Promise<string>;
export declare function eventDetail(id: string): Promise<string>;
export declare function categories(): Promise<string>;
export declare function sources(): Promise<string>;
export declare function eventsOnMap(category: string, limit: number): Promise<string>;

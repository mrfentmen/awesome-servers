export declare class LigoError extends Error {
}
export declare function listCatalogs(): Promise<string[]>;
export interface GwEvent {
    name: string;
    version?: number;
    gps?: number;
    catalog?: string;
}
export declare function listEvents(catalog?: string, limit?: number): Promise<GwEvent[]>;
export declare function getEvent(name: string): Promise<string>;
export declare function formatEvent(e: GwEvent, index?: number): string;
export declare function dataSegments(args: {
    dataset: string;
    detector: string;
    start: number;
    duration?: number;
    limit?: number;
}): Promise<string>;

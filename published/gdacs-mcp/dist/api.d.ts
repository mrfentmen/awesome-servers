export declare class GdacsError extends Error {
}
export declare const EVENT_TYPES: Record<string, string>;
export declare const TYPE_CODES: string[];
export declare const ALERT_LEVELS: readonly ["Green", "Orange", "Red"];
export declare function currentEvents(args: {
    types?: string[];
    levels?: string[];
    limit: number;
}): Promise<string>;
export declare function activeByType(type: string, limit: number): Promise<string>;
export declare function alertSummary(): Promise<string>;
export declare function eventDetail(eventId: number, eventType: string): Promise<string>;
export declare function typeCatalog(): Promise<string>;

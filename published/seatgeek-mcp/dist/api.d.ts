export declare class SeatGeekError extends Error {
}
export interface SgEvent {
    id: number;
    title?: string;
    date?: string;
    venue?: string;
    city?: string;
    price?: string;
    url?: string;
}
export declare function searchEvents(query: string, limit?: number): Promise<SgEvent[]>;
export declare function recommendEvents(lat: number, lon: number, limit?: number): Promise<SgEvent[]>;
export declare function formatEvent(e: SgEvent, index?: number): string;

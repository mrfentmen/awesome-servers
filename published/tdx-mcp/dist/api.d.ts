export declare class TdxError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listTraStations(): Promise<string>;
export declare function getTraLiveboard(stationId: string): Promise<string>;
export declare function listThsrStations(): Promise<string>;
export declare function getTraTimetable(stationId: string, date: string): Promise<string>;
export declare function odsStationSearch(args: {
    query: string;
    limit?: number;
}): Promise<string>;

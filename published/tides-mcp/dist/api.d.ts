export declare class TidesError extends Error {
}
export declare function predictions(station: string, begin: string, end: string, interval?: "hilo" | "h", units?: string): Promise<any>;
export declare function waterLevels(station: string, begin: string, end: string, interval?: string, units?: string): Promise<any>;
export declare function format(data: any): string;
/** What a set of high and low predictions adds up to: the tidal range, mean high and low water, and the biggest range in the window. */
export declare function tideStatistics(args: {
    station?: string;
    begin?: string;
    end?: string;
    units?: string;
}): Promise<string>;

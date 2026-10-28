export declare class TidesError extends Error {
}
export declare function predictions(station: string, begin: string, end: string, interval?: "hilo" | "h", units?: string): Promise<any>;
export declare function waterLevels(station: string, begin: string, end: string, interval?: string, units?: string): Promise<any>;
export declare function format(data: any): string;
export declare function stationList(a: {
    state?: string;
}): Promise<string>;
export declare function stationMetadata(a: {
    station: string;
}): Promise<string>;
export declare function tideRange(a: {
    station: string;
    begin: string;
    end: string;
    units: string;
}): Promise<string>;

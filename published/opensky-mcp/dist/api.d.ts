export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function getText(path: string, init?: RequestInit): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function aircraft_in_area(a: {
    lamin: number;
    lomin: number;
    lamax: number;
    lomax: number;
    limit?: number;
}): Promise<string>;
export declare function aircraft_state(a: {
    icao24: string;
}): Promise<string>;
export declare function flight_track(a: {
    icao24: string;
    limit?: number;
}): Promise<string>;
export declare function aircraft_near(a: {
    lat: number;
    lon: number;
    radiusKm?: number;
    limit?: number;
}): Promise<string>;
export declare function airport_arrivals(a: {
    airport: string;
    hours?: number;
}): Promise<string>;

export declare class MetNoError extends Error {
}
export declare function currentConditions(lat: number, lon: number): Promise<string>;
export declare function hourly(lat: number, lon: number, hours: number): Promise<string>;
export declare function daily(lat: number, lon: number, days: number): Promise<string>;
export declare function precipitationOutlook(lat: number, lon: number, hours: number): Promise<string>;
export declare function compare(latA: number, lonA: number, latB: number, lonB: number): Promise<string>;

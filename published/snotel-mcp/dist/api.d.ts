export declare class SourceError extends Error {
}
export declare function getJson(path: string): Promise<any>;
export declare function getText(path: string, accept?: string): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function stationsInState(a: {
    state: string;
    network: string;
    limit?: number;
}): Promise<string>;
export declare function stationReadings(a: {
    stationTriplet: string;
    elements: string;
    days?: number;
}): Promise<string>;
export declare function stationMetadata(a: {
    stationTriplet: string;
}): Promise<string>;
export declare function peakSnowWaterEquivalent(a: {
    stationTriplet: string;
    year: number;
}): Promise<string>;
export declare function snowSummary(a: {
    state: string;
    network: string;
    limit: number;
}): Promise<string>;

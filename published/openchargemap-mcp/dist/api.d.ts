export declare class OcmError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function nearby(lat: string, lon: string, distance?: string, maxResults?: string): Promise<string>;
export declare function getPoi(poiId: string): Promise<string>;
/** Charging stations around a point, read from OpenStreetMap rather than the OCM registry. */
export declare function osmChargersNearby(args: {
    lat?: number;
    lon?: number;
    radius_km?: number;
    limit?: number;
}): Promise<string>;
/** What charging coverage actually looks like in an area, aggregated over the mapped stations. */
export declare function chargerCoverageGap(args: {
    lat?: number;
    lon?: number;
    radius_km?: number;
}): Promise<string>;
/** Charge time arithmetic for a real battery, with the taper modelled rather than hidden. */
export declare function chargeTimeEstimate(args: {
    battery_kwh?: number;
    power_kw?: number;
    from_pct?: number;
    to_pct?: number;
    efficiency_pct?: number;
    dc?: boolean;
}): Promise<string>;

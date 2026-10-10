export declare class ShootProofError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getServiceDescription(): Promise<string>;
export declare function getMe(): Promise<string>;
export declare function listBrands(): Promise<string>;
export declare function listBrandEvents(brandId: string): Promise<string>;
export declare function listBrandOrders(brandId: string): Promise<string>;
/**
 * The light on one day at one place, hour by hour: sunrise, sunset, solar noon,
 * day length, all three twilight boundaries, and the golden and blue hour
 * windows a photographer schedules around. All times are UTC, because that is
 * what the solar service publishes.
 */
export declare function daylightProfile(args: {
    lat: number;
    lon: number;
    date: string;
}): Promise<string>;
/**
 * The same date at several places, ranked by how much daylight there is, so a
 * shoot can be moved to wherever the light is best without checking each place
 * by hand.
 */
export declare function daylightComparison(args: {
    locations: Array<{
        name?: string;
        lat: number;
        lon: number;
    }>;
    date: string;
}): Promise<string>;

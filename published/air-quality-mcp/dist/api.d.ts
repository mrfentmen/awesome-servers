export declare class AirQualityError extends Error {
}
export declare function currentAirQuality(latitude: number, longitude: number): Promise<string>;
export declare function airQualityForecast(latitude: number, longitude: number, hours?: number): Promise<string>;
export declare function pollutantDetail(latitude: number, longitude: number): Promise<string>;
export declare function pollenForecast(latitude: number, longitude: number, hours?: number): Promise<string>;
export declare function compareLocations(locations: {
    name?: string;
    latitude: number;
    longitude: number;
}[]): Promise<string>;

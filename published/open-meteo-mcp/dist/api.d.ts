export declare class MeteoError extends Error {
}
export interface Place {
    name?: string;
    latitude?: number;
    longitude?: number;
    country?: string;
    admin1?: string;
    timezone?: string;
    population?: number;
}
export interface Forecast {
    current?: {
        temperature?: number;
        windspeed?: number;
        winddirection?: number;
        weathercode?: number;
        is_day?: number;
        time?: string;
    };
    daily?: {
        time?: string[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        precipitation_probability_max?: number[];
        weathercode?: number[];
    };
    daily_units?: Record<string, string>;
    timezone?: string;
}
export declare function geocode(place: string, count?: number): Promise<Place[]>;
export declare function getForecast(latitude: number, longitude: number, days?: number): Promise<Forecast>;
export declare const WMO: Record<number, string>;
export declare function weatherName(code?: number): string;
export declare function formatPlace(p: Place): string;
export declare function formatForecast(f: Forecast, placeName: string): string;

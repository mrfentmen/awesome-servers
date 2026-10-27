export declare class NwsError extends Error {
}
export type PointInfo = NonNullable<Points["properties"]>;
interface Points {
    properties?: {
        forecast?: string;
        forecastHourly?: string;
        forecastOffice?: string;
        timeZone?: string;
        relativeLocation?: {
            properties?: {
                city?: string;
                state?: string;
            };
        };
        observationStations?: string;
    };
}
interface ForecastPeriod {
    name?: string;
    temperature?: number;
    temperatureUnit?: string;
    windSpeed?: string;
    windDirection?: string;
    shortForecast?: string;
    detailedForecast?: string;
    startTime?: string;
    isDaytime?: boolean;
}
interface AlertFeature {
    properties?: {
        event?: string;
        severity?: string;
        urgency?: string;
        headline?: string;
        areaDesc?: string;
        effective?: string;
        expires?: string;
        senderName?: string;
    };
}
interface StationFeature {
    properties?: {
        stationIdentifier?: string;
        name?: string;
    };
    geometry?: {
        coordinates?: [number, number];
    };
}
export declare function points(lat: number, lon: number): Promise<PointInfo>;
export declare function forecast(lat: number, lon: number): Promise<ForecastPeriod[]>;
export declare function hourly(lat: number, lon: number): Promise<ForecastPeriod[]>;
export declare function alerts(area: string): Promise<AlertFeature[]>;
export declare function stations(lat: number, lon: number): Promise<StationFeature[]>;
export declare function observation(station: string): Promise<string>;
export declare function periodText(p: ForecastPeriod): string;
export declare function alertText(a: AlertFeature): string;
export {};

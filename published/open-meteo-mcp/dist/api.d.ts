export interface m0_Place {
    name?: string;
    latitude?: number;
    longitude?: number;
    country?: string;
    admin1?: string;
    timezone?: string;
    population?: number;
}
export interface m0_Forecast {
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
export declare const ElevationError: {
    new (message?: string): {
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    };
    new (message?: string, options?: ErrorOptions): {
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    };
    captureStackTrace(targetObject: object, constructorOpt?: Function): void;
    prepareStackTrace(err: Error, stackTraces: NodeJS.CallSite[]): any;
    stackTraceLimit: number;
};
export declare const MeteoError: {
    new (message?: string): {
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    };
    new (message?: string, options?: ErrorOptions): {
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    };
    captureStackTrace(targetObject: object, constructorOpt?: Function): void;
    prepareStackTrace(err: Error, stackTraces: NodeJS.CallSite[]): any;
    stackTraceLimit: number;
};
export declare const UvError: {
    new (message?: string): {
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    };
    new (message?: string, options?: ErrorOptions): {
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    };
    captureStackTrace(targetObject: object, constructorOpt?: Function): void;
    prepareStackTrace(err: Error, stackTraces: NodeJS.CallSite[]): any;
    stackTraceLimit: number;
};
export declare const elevation: (args: {
    lat?: number;
    lon?: number;
}) => Promise<string>;
export declare const formatForecast: (f: m0_Forecast, placeName: string) => string;
export declare const formatPlace: (p: m0_Place) => string;
export declare const geocode: (place: string, count?: number) => Promise<m0_Place[]>;
export declare const getForecast: (latitude: number, longitude: number, days?: number) => Promise<m0_Forecast>;
export declare const uvForecast: (args: {
    lat?: number;
    lon?: number;
    days?: number;
}) => Promise<string>;
export declare const weatherName: (code?: number) => string;
export declare const m0_MeteoError: {
    new (message?: string): {
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    };
    new (message?: string, options?: ErrorOptions): {
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    };
    captureStackTrace(targetObject: object, constructorOpt?: Function): void;
    prepareStackTrace(err: Error, stackTraces: NodeJS.CallSite[]): any;
    stackTraceLimit: number;
};
export declare const m0_formatForecast: (f: m0_Forecast, placeName: string) => string;
export declare const m0_geocode: (place: string, count?: number) => Promise<m0_Place[]>;
export declare const m0_getForecast: (latitude: number, longitude: number, days?: number) => Promise<m0_Forecast>;
export declare const m0_weatherName: (code?: number) => string;
export declare const m0_formatPlace: (p: m0_Place) => string;
export declare const m1_ElevationError: {
    new (message?: string): {
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    };
    new (message?: string, options?: ErrorOptions): {
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    };
    captureStackTrace(targetObject: object, constructorOpt?: Function): void;
    prepareStackTrace(err: Error, stackTraces: NodeJS.CallSite[]): any;
    stackTraceLimit: number;
};
export declare const m1_elevation: (args: {
    lat?: number;
    lon?: number;
}) => Promise<string>;
export declare const m2_UvError: {
    new (message?: string): {
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    };
    new (message?: string, options?: ErrorOptions): {
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    };
    captureStackTrace(targetObject: object, constructorOpt?: Function): void;
    prepareStackTrace(err: Error, stackTraces: NodeJS.CallSite[]): any;
    stackTraceLimit: number;
};
export declare const m2_uvForecast: (args: {
    lat?: number;
    lon?: number;
    days?: number;
}) => Promise<string>;
export declare const AirError: {
    new (message?: string): {
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    };
    new (message?: string, options?: ErrorOptions): {
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    };
    captureStackTrace(targetObject: object, constructorOpt?: Function): void;
    prepareStackTrace(err: Error, stackTraces: NodeJS.CallSite[]): any;
    stackTraceLimit: number;
};
export declare const airQuality: (args: {
    lat?: number;
    lon?: number;
}) => Promise<string>;
export declare const marine: (args: {
    lat?: number;
    lon?: number;
}) => Promise<string>;
export declare const flood: (args: {
    lat?: number;
    lon?: number;
}) => Promise<string>;
export declare const hourly: (args: {
    lat?: number;
    lon?: number;
    hours?: number;
}) => Promise<string>;
export declare const m3_AirError: {
    new (message?: string): {
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    };
    new (message?: string, options?: ErrorOptions): {
        name: string;
        message: string;
        stack?: string;
        cause?: unknown;
    };
    captureStackTrace(targetObject: object, constructorOpt?: Function): void;
    prepareStackTrace(err: Error, stackTraces: NodeJS.CallSite[]): any;
    stackTraceLimit: number;
};
export declare const m3_airQuality: (args: {
    lat?: number;
    lon?: number;
}) => Promise<string>;
export declare const m3_marine: (args: {
    lat?: number;
    lon?: number;
}) => Promise<string>;
export declare const m3_flood: (args: {
    lat?: number;
    lon?: number;
}) => Promise<string>;
export declare const m3_hourly: (args: {
    lat?: number;
    lon?: number;
    hours?: number;
}) => Promise<string>;

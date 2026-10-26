/**
 * PVGIS client, keyless.
 * European Commission solar data: PV yield, irradiation, typical weather and hourly series.
 */
export declare class PvgisError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export interface MonthlyPv {
    month: number;
    E_m?: number;
    E_d?: number;
    "H(i)_m"?: number;
    "H(i)_d"?: number;
    SD_m?: number;
}
export interface PvTotals {
    E_d?: number;
    E_m?: number;
    E_y?: number;
    "H(i)_d"?: number;
    "H(i)_m"?: number;
    "H(i)_y"?: number;
    SD_m?: number;
    SD_y?: number;
    l_total?: number;
}
export interface PvResponse {
    inputs?: {
        location?: {
            latitude: number;
            longitude: number;
            elevation: number;
        };
        meteo_data?: {
            radiation_db: string;
            year_min: number;
            year_max: number;
        };
        mounting_system?: {
            fixed?: {
                slope?: {
                    value: number;
                    optimal: boolean;
                };
                azimuth?: {
                    value: number;
                    optimal: boolean;
                };
            };
        };
        pv_module?: {
            peak_power: number;
            system_loss: number;
        };
    };
    outputs?: {
        monthly?: {
            fixed?: MonthlyPv[];
        };
        totals?: {
            fixed?: PvTotals;
        };
    };
}
export interface HourlyRow {
    time?: string;
    "time(UTC)"?: string;
    "G(i)"?: number;
    "G(h)"?: number;
    "Gb(n)"?: number;
    "Gd(h)"?: number;
    "H_sun"?: number;
    T2m?: number;
    RH?: number;
    WS10m?: number;
    WD10m?: number;
    Int?: number;
    SP?: number;
}
export interface SeriesResponse {
    outputs?: {
        hourly?: HourlyRow[];
    };
}
export interface TmyResponse {
    outputs?: {
        tmy_hourly?: HourlyRow[];
        months_selected?: Array<{
            month: number;
            year: number;
        }>;
    };
}
export interface Location {
    lat: number;
    lon: number;
}
export declare function parseLocation(lat: string, lon: string): Location;
export declare function pvYield(lat: string, lon: string, peakPower?: number, loss?: number, angle?: number, aspect?: number): Promise<PvResponse>;
export declare function formatPvYield(data: PvResponse, loc: Location): string;
export declare function radiation(lat: string, lon: string, angle?: number, aspect?: number): Promise<string>;
export declare function hourlyOutput(lat: string, lon: string, year?: number, peakPower?: number, loss?: number, angle?: number): Promise<string>;
export declare function typicalWeather(lat: string, lon: string): Promise<string>;
export declare function systemSummary(lat: string, lon: string, peakPower?: number, loss?: number, angle?: number): Promise<string>;
export declare function compareLocations(sites: string, peakPower?: number, loss?: number): Promise<string>;
export declare function sizeSystem(lat: string, lon: string, annualKwh: number, loss?: number, angle?: number): Promise<string>;
/**
 * What the terrain does to the sun at this exact spot. PVGIS applies this
 * horizon to every radiation calculation behind the scenes, so a system that
 * looks fine on paper can be blocked by a hill.
 */
export declare function horizonProfile(lat: string, lon: string): Promise<string>;
/**
 * Sizes an off-grid system against a real daily load: PVGIS simulates the
 * battery day by day and reports how often it runs flat, which is the number
 * that decides whether the array or the battery is too small.
 */
export declare function offgridSizing(args: {
    lat: string;
    lon: string;
    peakPower?: number;
    batteryWh?: number;
    dailyWh?: number;
    cutoff?: number;
}): Promise<string>;
/**
 * The tilt and direction PVGIS says are best here, set against the 30-degree
 * rule of thumb, so a mounting decision has a number behind it.
 */
export declare function optimalTilt(args: {
    lat: string;
    lon: string;
    loss?: number;
}): Promise<string>;
/**
 * How much the solar resource actually varied year to year, month by month,
 * across the whole PVGIS reference period. A monthly average hides the bad year
 * that decides whether a P90 guarantee is met.
 */
export declare function solarVariability(args: {
    lat: string;
    lon: string;
}): Promise<string>;
/**
 * The shape of a day: average global irradiance by hour, split into a summer
 * and a winter half-year, plus the direct and diffuse split that decides how
 * much of the morning a tracker can actually follow.
 */
export declare function diurnalProfile(args: {
    lat: string;
    lon: string;
}): Promise<string>;

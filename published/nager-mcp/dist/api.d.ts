/**
 * Nager.Date public holiday API client, keyless.
 * Covers 100+ countries: holidays, next holidays, long weekends.
 */
export declare class NagerError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export interface Country {
    countryCode: string;
    name: string;
}
export interface Holiday {
    date: string;
    localName: string;
    name: string;
    countryCode: string;
    global?: boolean;
    counties?: string[] | null;
    types?: string[];
}
export interface CountryInfo {
    commonName: string;
    officialName: string;
    countryCode: string;
    region: string;
    borders?: Array<{
        commonName: string;
        officialName: string;
        countryCode: string;
    }> | null;
}
export interface LongWeekend {
    startDate: string;
    endDate: string;
    dayCount: number;
    needBridgeDay: boolean;
    bridgeDays?: string[];
}
export declare function countries(): Promise<Country[]>;
export declare function countryInfo(country: string): Promise<CountryInfo>;
export declare function holidays(year: string, country: string): Promise<Holiday[]>;
export declare function nextHolidays(country: string): Promise<Holiday[]>;
export declare function worldwideHolidays(): Promise<Holiday[]>;
export declare function longWeekends(year: string, country: string): Promise<LongWeekend[]>;
export type TodayResult = {
    isHoliday: true;
    holiday: Holiday;
} | {
    isHoliday: false;
};
export declare function isTodayHoliday(country: string): Promise<TodayResult>;
export declare function normaliseCountry(country: string): string;
export declare function formatHoliday(h: Holiday): string;
export declare function formatHolidays(list: Holiday[], title: string): string;
export declare function formatCountryInfo(info: CountryInfo): string;
export declare function formatLongWeekends(list: LongWeekend[], title: string): string;
export declare function regionalHolidays(year: string, country: string, county: string): Promise<string>;
export declare function holidayOnDate(date: string, country: string): Promise<string>;
export declare function compareCountries(year: string, countryA: string, countryB: string): Promise<string>;
/** Month by month working-day arithmetic for one country and year. */
export declare function workingDayCalendar(args: {
    country: string;
    year: string;
}): Promise<string>;
/** Where each holiday lands, and what it does to the working week around it. */
export declare function holidayObservanceAudit(args: {
    country: string;
    year: string;
}): Promise<string>;

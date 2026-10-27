export declare class HolidayError extends Error {
}
export declare function listCountries(): Promise<string>;
export declare function holidaysForYear(country: string, year: number): Promise<string>;
export declare function upcoming(country: string): Promise<string>;
export declare function isToday(country: string): Promise<string>;
export declare function longWeekends(country: string, year: number): Promise<string>;
export declare function countryInfo(country: string): Promise<string>;
export declare function holidayOnDate(country: string, date: string): Promise<string>;

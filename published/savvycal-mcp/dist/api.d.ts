export declare function errorMessage(e: unknown): string;
export declare function isKnownZone(timeZone: string): boolean;
/** Offset of a zone east of UTC, in milliseconds, at one instant. */
export declare function zoneOffsetMs(timeZone: string, instantMs: number): number;
export declare function offsetLabel(offsetMs: number): string;
export declare function formatInZone(timeZone: string, instantMs: number): string;
/** Converts a wall-clock time in one zone to the matching instant, DST aware. */
export declare function zonedTimeToInstant(timeZone: string, year: number, month: number, day: number, hour: number, minute: number): number;
export declare function parseDateTime(input: string): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
};
export declare function convertTime(args: {
    dateTime: string;
    fromTimeZone: string;
    toTimeZone: string;
}): Promise<string>;
export declare function timezoneInfo(args: {
    timeZone: string;
    year?: number;
}): Promise<string>;
export declare function businessDays(args: {
    startDate: string;
    endDate: string;
    weekendDays?: number[];
    holidays?: string[];
}): Promise<string>;
export declare function addBusinessDays(args: {
    startDate: string;
    days: number;
    weekendDays?: number[];
    holidays?: string[];
}): Promise<string>;
export declare function meetingSlots(args: {
    date: string;
    timeZone: string;
    durationMinutes?: number;
    workStartHour?: number;
    workEndHour?: number;
    busy?: string[];
    alsoShow?: string[];
}): Promise<string>;
export declare function worldClock(args: {
    timeZones: string[];
}): Promise<string>;
export declare function teamOverlap(args: {
    timeZones: string[];
    windowStartHour?: number;
    windowEndHour?: number;
}): Promise<string>;

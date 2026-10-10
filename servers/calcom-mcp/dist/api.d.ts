export declare class CalError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listEventTypes(): Promise<string>;
export declare function listBookings(): Promise<string>;
export declare function listSchedules(): Promise<string>;
export declare function eventType(typeId: string): Promise<string>;
export declare function booking(uid: string): Promise<string>;
export declare function schedule(scheduleId: string): Promise<string>;
export declare function teams(): Promise<string>;
export declare function teamDetails(teamId: string): Promise<string>;
export declare function webhooks(): Promise<string>;
export declare function me(): Promise<string>;
export interface SlotsArgs {
    event_type_id: string;
    start_date: string;
    end_date: string;
    time_zone?: string;
}
/** Every open slot between two dates, with a per-day count. */
export declare function openSlots(args: SlotsArgs): Promise<string>;
export interface DensityArgs {
    event_type_id: string;
    start_date: string;
    end_date: string;
    time_zone?: string;
}
/** Which days are open and how busy: a per-day slot count with a weekday shape. */
export declare function slotDensity(args: DensityArgs): Promise<string>;
export interface PublicTypesArgs {
    username: string;
}
/** GET /v2/event-types?username= - public booking pages, no key needed. */
export declare function publicEventTypes(args: PublicTypesArgs): Promise<string>;

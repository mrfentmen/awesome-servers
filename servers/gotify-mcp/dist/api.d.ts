export declare class GotifyError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function sendMessage(title: string, message: string, priority?: string): Promise<string>;
export declare function listMessages(limit?: string): Promise<string>;
export declare function listApps(): Promise<string>;
export interface AlertPayloadArgs {
    title: string;
    message: string;
    priority: string;
    tags?: string;
    click?: string;
    extras?: string;
}
/**
 * Builds the exact JSON body Gotify accepts, then reports its size against the
 * platform caps. Nothing is sent: this is the payload you can post yourself.
 */
export declare function alertPayload(args: AlertPayloadArgs): Promise<string>;
export interface RetryScheduleArgs {
    base_delay_ms?: number;
    multiplier?: number;
    cap_ms?: number;
    attempts?: number;
    jitter?: string;
}
/**
 * The concrete retry ladder for a push pipeline: exponential growth, a cap, and
 * full-jitter delays drawn from a seed so the schedule is reproducible.
 */
export declare function retrySchedule(args: RetryScheduleArgs): Promise<string>;

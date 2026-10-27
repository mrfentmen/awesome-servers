export declare class FrigateError extends Error {
}
export declare function serverVersion(): Promise<string>;
export declare function stats(): Promise<string>;
export interface FrigateEvent {
    id: string;
    camera?: string;
    label?: string;
    score?: number;
    start?: string;
    hasClip?: boolean;
}
export declare function recentEvents(camera?: string, limit?: number): Promise<FrigateEvent[]>;
export declare function formatEvent(e: FrigateEvent, index?: number): string;
import { z } from "zod";
declare const Event: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    camera: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
    sub_label: z.ZodOptional<z.ZodString>;
    score: z.ZodOptional<z.ZodNumber>;
    top_score: z.ZodOptional<z.ZodNumber>;
    average_score: z.ZodOptional<z.ZodNumber>;
    start_time: z.ZodOptional<z.ZodNumber>;
    end_time: z.ZodOptional<z.ZodNumber>;
    has_clip: z.ZodOptional<z.ZodBoolean>;
    has_snapshot: z.ZodOptional<z.ZodBoolean>;
    has_been_reviewed: z.ZodOptional<z.ZodBoolean>;
    zones: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodOptional<z.ZodString>;
    camera: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
    sub_label: z.ZodOptional<z.ZodString>;
    score: z.ZodOptional<z.ZodNumber>;
    top_score: z.ZodOptional<z.ZodNumber>;
    average_score: z.ZodOptional<z.ZodNumber>;
    start_time: z.ZodOptional<z.ZodNumber>;
    end_time: z.ZodOptional<z.ZodNumber>;
    has_clip: z.ZodOptional<z.ZodBoolean>;
    has_snapshot: z.ZodOptional<z.ZodBoolean>;
    has_been_reviewed: z.ZodOptional<z.ZodBoolean>;
    zones: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodOptional<z.ZodString>;
    camera: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
    sub_label: z.ZodOptional<z.ZodString>;
    score: z.ZodOptional<z.ZodNumber>;
    top_score: z.ZodOptional<z.ZodNumber>;
    average_score: z.ZodOptional<z.ZodNumber>;
    start_time: z.ZodOptional<z.ZodNumber>;
    end_time: z.ZodOptional<z.ZodNumber>;
    has_clip: z.ZodOptional<z.ZodBoolean>;
    has_snapshot: z.ZodOptional<z.ZodBoolean>;
    has_been_reviewed: z.ZodOptional<z.ZodBoolean>;
    zones: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, z.ZodTypeAny, "passthrough">>;
type EventT = z.infer<typeof Event>;
export interface AnalyzeEventsArgs {
    events: EventT[];
}
export declare function analyze_events(args: AnalyzeEventsArgs): string;
export interface EventTimelineArgs {
    events: EventT[];
    gapMinutes?: number;
}
export declare function event_timeline(args: EventTimelineArgs): string;
export interface ThresholdArgs {
    events: EventT[];
    threshold?: number;
    label?: string;
}
export declare function threshold_advice(args: ThresholdArgs): string;
export {};

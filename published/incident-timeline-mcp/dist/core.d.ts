export declare class IncidentError extends Error {
}
export declare function summarizeIncidentTimeline(input: {
    project: string;
}): Promise<{
    logFiles: number;
    linesObserved: number;
    levelCounts: Record<string, number>;
    timestampCount: number;
    largestGapBucket: string;
    timelineSignal: string;
    valueFree: boolean;
    warning: string;
}>;
export declare function format(v: unknown): string;

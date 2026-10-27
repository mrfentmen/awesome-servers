export interface MediaProbeArgs {
    path: string;
}
export declare function mediaProbe(args: MediaProbeArgs): Promise<string>;
export interface TimecodeConvertArgs {
    value: string;
    rate?: string;
}
export declare function timecodeConvert(args: TimecodeConvertArgs): Promise<string>;
export declare function searchArchiveFootage(args: {
    query?: string;
    limit?: number;
}): Promise<string>;

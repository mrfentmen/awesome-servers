export interface m0_SeasonArgs {
    year?: number;
}
interface ConstructorStandingsArgs {
    season?: string;
    limit?: number;
}
interface QualifyingReportArgs {
    season?: string;
    round?: string;
    limit?: number;
}
export declare const F1Error: {
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
export declare const current: (_args?: unknown) => Promise<string>;
export declare const driverStandings: (args: Record<string, never>) => Promise<string>;
export declare const drivers: (args: m0_SeasonArgs) => Promise<string>;
export declare const lastRace: (args: Record<string, never>) => Promise<string>;
export declare const races: (args: m0_SeasonArgs) => Promise<string>;
export declare const seasonSchedule: (args: {
    season?: number;
}) => Promise<string>;
export declare const m0_drivers: (args: m0_SeasonArgs) => Promise<string>;
export declare const m0_races: (args: m0_SeasonArgs) => Promise<string>;
export declare const m0_current: (_args?: unknown) => Promise<string>;
export declare const m1_seasonSchedule: (args: {
    season?: number;
}) => Promise<string>;
export declare const m1_lastRace: (args: Record<string, never>) => Promise<string>;
export declare const m1_driverStandings: (args: Record<string, never>) => Promise<string>;
export declare const m1_F1Error: {
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
export declare const m1_constructorStandings: (args: ConstructorStandingsArgs) => Promise<string>;
export declare const m1_qualifyingReport: (args: QualifyingReportArgs) => Promise<string>;
export {};

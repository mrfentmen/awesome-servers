export declare const IssError: {
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
export declare const issNow: (_args: Record<string, never>) => Promise<string>;
export declare const issPasses: (args: {
    lat?: number;
    lon?: number;
    days?: number;
}) => Promise<string>;
export declare const position: (_args?: Record<string, never>) => Promise<string>;
export declare const m0_issPasses: (args: {
    lat?: number;
    lon?: number;
    days?: number;
}) => Promise<string>;
export declare const m0_IssError: {
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
export declare const m0_issNow: (_args: Record<string, never>) => Promise<string>;
export declare const m1_position: (_args?: Record<string, never>) => Promise<string>;
/** What the station is over right now, reverse geocoded from its live position. */
export declare function issGroundTrack(): Promise<string>;
/** A place name to coordinates, so iss_passes can be asked about a town. */
export declare function resolvePlace(place: string, limit?: number): Promise<string>;

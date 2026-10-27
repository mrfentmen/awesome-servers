export interface m1_SearchArgs {
    query: string;
    limit?: number;
}
export declare const WikidataError: {
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
export declare const entity: (id: string) => Promise<any>;
export declare const format: (x: unknown) => string;
export declare const search: (query: string) => Promise<any>;
export declare const sparql: (query: string) => Promise<any>;
export declare const m0_sparql: (query: string) => Promise<any>;
export declare const m0_entity: (id: string) => Promise<any>;
export declare const m0_search: (query: string) => Promise<any>;
export declare const m0_format: (x: unknown) => string;
export declare const m0_WikidataError: {
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
export declare const m1_search: (args: m1_SearchArgs) => Promise<string>;

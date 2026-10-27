export interface m0_ArchiveItem {
    identifier: string;
    title?: string;
    mediatype?: string;
    year?: string;
    downloads?: number;
    collection?: string[];
    description?: string;
}
export interface m0_ArchiveFile {
    name: string;
    size?: number;
    format?: string;
    length?: string;
    title?: string;
}
export interface m1_Snapshot {
    timestamp: string;
    original: string;
    statusCode: string;
    mimeType: string;
    length: string;
    url: string;
}
export declare const ArchiveError: {
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
export declare const WaybackError: {
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
export declare const fmtSize: (bytes?: number) => string;
export declare const fmtTimestamp: (ts: string) => string;
export declare const formatItem: (it: m0_ArchiveItem, index: number) => string;
export declare const formatSnapshot: (s: m1_Snapshot, index?: number) => string;
export declare const getAvailability: (url: string) => Promise<m1_Snapshot | null>;
export declare const getItemDetails: (identifier: string) => Promise<{
    identifier: string;
    title?: string;
    mediatype?: string;
    description?: string;
    files: m0_ArchiveFile[];
}>;
export declare const getSnapshotText: (timestamp: string, originalUrl: string, maxChars?: number) => Promise<string>;
export declare const getSnapshots: (url: string, limit?: number) => Promise<m1_Snapshot[]>;
export declare const searchItems: (query: string, mediatype: string | undefined, limit?: number) => Promise<m0_ArchiveItem[]>;
export declare const m0_fmtSize: (bytes?: number) => string;
export declare const m0_ArchiveError: {
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
export declare const m0_getItemDetails: (identifier: string) => Promise<{
    identifier: string;
    title?: string;
    mediatype?: string;
    description?: string;
    files: m0_ArchiveFile[];
}>;
export declare const m0_formatItem: (it: m0_ArchiveItem, index: number) => string;
export declare const m0_searchItems: (query: string, mediatype: string | undefined, limit?: number) => Promise<m0_ArchiveItem[]>;
export declare const m1_fmtTimestamp: (ts: string) => string;
export declare const m1_formatSnapshot: (s: m1_Snapshot, index?: number) => string;
export declare const m1_getAvailability: (url: string) => Promise<m1_Snapshot | null>;
export declare const m1_WaybackError: {
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
export declare const m1_getSnapshotText: (timestamp: string, originalUrl: string, maxChars?: number) => Promise<string>;
export declare const m1_getSnapshots: (url: string, limit?: number) => Promise<m1_Snapshot[]>;
export interface SnapshotTimelineArgs {
    url: string;
    from?: number;
    to?: number;
    limit?: number;
}
export interface SearchProfileArgs {
    query: string;
    mediatype?: string;
    limit?: number;
}
export declare function searchProfile(args: SearchProfileArgs): Promise<string>;

export interface m0_ArtObject {
    objectID: number;
    title?: string;
    artistDisplayName?: string;
    artistDisplayBio?: string;
    objectDate?: string;
    medium?: string;
    department?: string;
    culture?: string;
    classification?: string;
    primaryImage?: string;
    objectURL?: string;
    dimensions?: string;
    accessionYear?: string;
    isPublicDomain?: boolean;
}
export declare const MetError: {
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
export declare const formatObject: (o: m0_ArtObject) => string;
export declare const getDepartments: () => Promise<{
    departmentId: number;
    displayName: string;
}[]>;
export declare const getObject: (id: number) => Promise<m0_ArtObject | null>;
export declare const object: (args: {
    id?: number;
}) => Promise<string>;
export declare const search: (args: {
    query?: string;
    limit?: number;
}) => Promise<string>;
export declare const searchObjects: (query: string, limit?: number) => Promise<m0_ArtObject[]>;
export declare const m0_searchObjects: (query: string, limit?: number) => Promise<m0_ArtObject[]>;
export declare const m0_getDepartments: () => Promise<{
    departmentId: number;
    displayName: string;
}[]>;
export declare const m0_formatObject: (o: m0_ArtObject) => string;
export declare const m0_MetError: {
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
export declare const m0_getObject: (id: number) => Promise<m0_ArtObject | null>;
export declare const m1_search: (args: {
    query?: string;
    limit?: number;
}) => Promise<string>;
export declare const m1_object: (args: {
    id?: number;
}) => Promise<string>;
export declare const m1_MetError: {
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

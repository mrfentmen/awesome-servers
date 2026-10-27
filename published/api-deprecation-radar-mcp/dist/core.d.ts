export declare class DeprecationError extends Error {
}
export declare function inspectDeprecationRadar(input: {
    project: string;
}): Promise<{
    filesScanned: number;
    markerCount: number;
    severityBuckets: Record<string, number>;
    reviewSignal: string;
    valueFree: boolean;
    warning: string;
}>;
export declare function format(v: unknown): string;
export declare function inspectVersionPins(input: {
    project: string;
    pin?: string;
}): Promise<{
    filesScanned: number;
    manifests: number;
    totals: {
        entries: number;
        exact: number;
        caret: number;
        tilde: number;
        wildcard: number;
        any: number;
        loose: number;
    };
    floatingShare: number;
    detail: {
        manifest: string;
        ecosystem: string;
        entries: number;
        exact: number;
        caret: number;
        tilde: number;
        wildcard: number;
        any: number;
        loose: number;
        matched: string[];
    }[];
    filter: string;
    valueFree: boolean;
    warning: string;
}>;
export declare function inspectEndpointInventory(input: {
    project: string;
    scheme?: string;
}): Promise<{
    filesScanned: number;
    hardCodedUrls: number;
    distinctEndpoints: number;
    versionedPaths: [string, number][];
    insecureEndpoints: [string, number][];
    topEndpoints: {
        endpoint: string;
        occurrences: number;
    }[];
    filter: string;
    valueFree: boolean;
    warning: string;
}>;

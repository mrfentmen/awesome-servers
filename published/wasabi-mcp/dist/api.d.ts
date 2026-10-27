export declare class WasabiError extends Error {
}
export declare function listBuckets(): Promise<string[]>;
export interface S3Object {
    key: string;
    size?: number;
    modified?: string;
}
export declare function listObjects(bucket: string, prefix?: string, limit?: number): Promise<S3Object[]>;
export declare function formatObject(o: S3Object, index?: number): string;

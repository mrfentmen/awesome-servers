export declare const errorMessage: (e: unknown) => string;
export declare function searchSpdx(args: {
    query?: string;
    limit?: number;
}): Promise<string>;
export declare function spdxLicense(args: {
    id: string;
}): Promise<string>;
export declare function spdxException(args: {
    id: string;
}): Promise<string>;

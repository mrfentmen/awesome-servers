export declare class LicenseChangeError extends Error {
}
export declare function compareLicenseEvidence(input: {
    before: string;
    after: string;
}): Promise<{
    beforeFiles: number;
    afterFiles: number;
    changedCategoryCount: number;
    categoryChanges: {
        [k: string]: {
            before: number;
            after: number;
        };
    };
    valueFree: boolean;
    warning: string;
}>;
export declare function format(v: unknown): string;

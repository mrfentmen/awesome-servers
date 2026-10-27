export declare class LicenseError extends Error {
}
export declare function inspectLicenseBoundary(input: {
    project: string;
}): Promise<{
    filesScanned: number;
    licenseEvidenceCounts: Record<string, number>;
    unknownEvidenceCount: number;
    reviewSignal: string;
    valueFree: boolean;
    warning: string;
}>;
export declare function format(v: unknown): string;
